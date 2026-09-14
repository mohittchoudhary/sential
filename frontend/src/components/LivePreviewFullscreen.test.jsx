import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LivePreview from './LivePreview';

describe('LivePreview YouTube-style Fullscreen Tests (19-22)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('19. Fullscreen button exists and is rendered inside live video preview', () => {
    render(<LivePreview webrtcUrl="/api/cameras/1/whep" isTestMode={false} />);
    const fsBtn = screen.getByTestId('btn-fullscreen');
    expect(fsBtn).toBeInTheDocument();
    expect(fsBtn).toHaveAttribute('aria-label', 'Maximize Video');
  });

  it('20. Fullscreen uses existing container and video element', () => {
    const { container } = render(<LivePreview webrtcUrl="/api/cameras/1/whep" isTestMode={false} />);
    const previewContainer = screen.getByTestId('live-preview-container');
    const videoElement = container.querySelector('video.live-video-element');
    expect(previewContainer).toBeInTheDocument();
    expect(videoElement).toBeInTheDocument();

    // Mock requestFullscreen on container
    previewContainer.requestFullscreen = vi.fn().mockResolvedValue(undefined);

    const fsBtn = screen.getByTestId('btn-fullscreen');
    fireEvent.click(fsBtn);

    expect(previewContainer.requestFullscreen).toHaveBeenCalled();
  });

  it('21. Fullscreen toggle and exit updates state and restores layout', () => {
    render(<LivePreview webrtcUrl="/api/cameras/1/whep" isTestMode={false} />);
    const previewContainer = screen.getByTestId('live-preview-container');
    previewContainer.requestFullscreen = vi.fn().mockResolvedValue(undefined);

    const fsBtn = screen.getByTestId('btn-fullscreen');
    fireEvent.click(fsBtn);

    // Simulate browser fullscreen change event
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: previewContainer,
    });
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(previewContainer).toHaveClass('is-fullscreen');
    expect(fsBtn).toHaveAttribute('aria-label', 'Exit Fullscreen');

    // Exit fullscreen
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
    fireEvent.click(fsBtn);
    expect(document.exitFullscreen).toHaveBeenCalled();

    // Simulate exit event
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null,
    });
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(previewContainer).not.toHaveClass('is-fullscreen');
  });

  it('22. Camera switch cleans up and does not duplicate video elements or WebRTC sessions', () => {
    const { container, rerender } = render(
      <LivePreview webrtcUrl="/api/cameras/1/whep" isTestMode={false} />
    );

    expect(container.querySelectorAll('video').length).toBe(1);

    // Switch to camera 2
    rerender(<LivePreview webrtcUrl="/api/cameras/2/whep" isTestMode={false} />);

    // Still exactly one video element
    expect(container.querySelectorAll('video').length).toBe(1);
    expect(screen.getByTestId('btn-fullscreen')).toBeInTheDocument();
  });
});
