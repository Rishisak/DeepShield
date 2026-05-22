import torch
import torch.nn.functional as F
import cv2
import numpy as np


class GradCAM:
    """
    Gradient-weighted Class Activation Mapping for the EfficientNet-B4
    branch of CombinedDeepfakeModel.

    Hooks into the last MBConv block to capture spatial feature maps and
    their gradients w.r.t. the FAKE class logit, producing a heatmap that
    highlights which facial regions most influenced the deepfake decision.
    """

    def __init__(self, model, device):
        self.model = model
        self.device = device
        self.activations = None
        self.gradients = None

        # Hook the last EfficientNet-B4 MBConv block
        target = model.eff.backbone._blocks[-1]
        self._fwd_hook = target.register_forward_hook(self._save_activation)
        self._bwd_hook = target.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, _module, _inp, out):
        self.activations = out.detach()

    def _save_gradient(self, _module, _grad_in, grad_out):
        self.gradients = grad_out[0].detach()

    def generate(self, rgb_tensor, fft_tensor):
        """
        Compute GradCAM heatmap for a single frame.

        Args:
            rgb_tensor: Tensor of shape (1, 1, 3, H, W) – single frame as
                        a sequence of length 1.
            fft_tensor: Tensor of shape (1, 1, 3, H, W).

        Returns:
            numpy.ndarray of shape (H', W') with values in [0, 1],
            or None if gradient capture failed.
        """
        # cuDNN RNN backward requires LSTM in train mode, but BatchNorm1d
        # in the temporal branch crashes with a single-frame sequence in
        # train mode. Solution: eval() everything, then train() only the LSTM.
        self.model.eval()
        self.model.lstm.train()   # ← only this needs train mode for cuDNN backward
        self.activations = None
        self.gradients = None

        rgb = rgb_tensor.to(self.device)
        fft = fft_tensor.to(self.device)

        with torch.enable_grad():
            out = self.model(rgb, fft)   # (1, 2)  — [real_logit, fake_logit]
            self.model.zero_grad()
            out[0, 1].backward()         # optimise gradient for FAKE class

        self.model.eval()  # restore full eval mode

        if self.activations is None or self.gradients is None:
            return None

        # Channel weights = global-average-pooled gradients
        weights = self.gradients.mean(dim=(2, 3), keepdim=True)   # (N, C, 1, 1)
        cam = F.relu((weights * self.activations).sum(dim=1))      # (N, H', W')
        cam = cam.squeeze()                                         # (H', W')

        # Normalise to [0, 1]
        mn, mx = cam.min(), cam.max()
        if mx > mn:
            cam = (cam - mn) / (mx - mn)
        else:
            cam = torch.zeros_like(cam)

        return cam.cpu().numpy()

    def overlay(self, frame_bgr, heatmap_np, alpha=0.45):
        """
        Blend a JET-coloured heatmap onto the original BGR frame.

        Args:
            frame_bgr  : numpy array (H, W, 3) in BGR colour space.
            heatmap_np : numpy array (H', W') normalised 0-1.
            alpha      : heatmap opacity (0 = invisible, 1 = fully opaque).

        Returns:
            Blended BGR numpy array.
        """
        h, w = frame_bgr.shape[:2]
        heat_u8 = (cv2.resize(heatmap_np, (w, h)) * 255).astype('uint8')
        coloured = cv2.applyColorMap(heat_u8, cv2.COLORMAP_JET)
        return cv2.addWeighted(frame_bgr, 1.0 - alpha, coloured, alpha, 0)

    def remove_hooks(self):
        """Must be called after use to avoid memory leaks."""
        self._fwd_hook.remove()
        self._bwd_hook.remove()
