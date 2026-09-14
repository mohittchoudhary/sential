import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CameraManagement from './CameraManagement';
import { cameraService } from '../api/cameraService';

vi.mock('../api/cameraService', () => ({
  cameraService: {
    createCamera: vi.fn(),
    updateCamera: vi.fn(),
    deleteCamera: vi.fn(),
  },
}));

const mockCameras = [
  {
    id: 1,
    camera_code: 'CAM-001',
    name: 'Camera 01',
    location: 'Chimanbhai Patel Bridge, Ahmedabad, Gujarat, India',
    latitude: 23.069362,
    longitude: 72.587224,
    status: 'online',
    stream_url: 'rtsp://103.250.160.189:8554/stream/cam01',
  },
  {
    id: 6,
    camera_code: 'CAM-006',
    name: 'Camera 06',
    location: 'Timbavadi Gate / Madhuram Bypass Road, Junagadh, Gujarat, India',
    latitude: 21.503,
    longitude: 70.43,
    status: 'online',
    stream_url: 'rtsp://103.250.160.189:8554/stream/cam06',
  },
];

describe('Camera Management Workspace Tests (1-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Camera Management page renders with header, search, and inventory table', () => {
    render(<CameraManagement cameras={mockCameras} />);
    expect(screen.getByText('CAMERA MANAGEMENT')).toBeInTheDocument();
    expect(screen.getByTestId('camera-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('btn-add-camera')).toBeInTheDocument();
    expect(screen.getByTestId('camera-row-CAM-001')).toBeInTheDocument();
    expect(screen.getByTestId('camera-row-CAM-006')).toBeInTheDocument();
    expect(screen.getAllByText('Stream: Configured').length).toBe(2);
  });

  it('2. Add Camera opens modal dialog', () => {
    render(<CameraManagement cameras={mockCameras} />);
    const addBtn = screen.getByTestId('btn-add-camera');
    fireEvent.click(addBtn);

    expect(screen.getByTestId('add-camera-modal')).toBeInTheDocument();
    expect(screen.getByText(/ONBOARD NODE/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CAMERA ID \*/i)).toBeInTheDocument();
  });

  it('3. Camera creation works with sanitized data', async () => {
    const refreshMock = vi.fn();
    cameraService.createCamera.mockResolvedValue({
      id: 9,
      camera_code: 'CAM-009',
      name: 'New Gate',
      location: 'Gandhinagar',
      latitude: 23.2,
      longitude: 72.6,
      status: 'offline',
    });

    render(<CameraManagement cameras={mockCameras} onRefreshCameras={refreshMock} />);
    fireEvent.click(screen.getByTestId('btn-add-camera'));

    fireEvent.change(screen.getByLabelText(/CAMERA ID \*/i), { target: { value: 'CAM-009' } });
    fireEvent.change(screen.getByLabelText(/CAMERA NAME \*/i), { target: { value: 'New Gate' } });
    fireEvent.change(screen.getByLabelText(/LOCATION \/ JUNCTION/i), { target: { value: 'Gandhinagar' } });
    fireEvent.change(screen.getByLabelText(/LATITUDE/i), { target: { value: '23.2' } });
    fireEvent.change(screen.getByLabelText(/LONGITUDE/i), { target: { value: '72.6' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-submit-add-camera'));
    });

    expect(cameraService.createCamera).toHaveBeenCalledWith(
      expect.objectContaining({
        camera_code: 'CAM-009',
        name: 'New Gate',
        location: 'Gandhinagar',
        latitude: 23.2,
        longitude: 72.6,
      })
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it('4. Coordinate validation rejects invalid latitude and longitude', async () => {
    render(<CameraManagement cameras={mockCameras} />);
    fireEvent.click(screen.getByTestId('btn-add-camera'));

    fireEvent.change(screen.getByLabelText(/CAMERA ID \*/i), { target: { value: 'CAM-INVALID' } });
    fireEvent.change(screen.getByLabelText(/CAMERA NAME \*/i), { target: { value: 'Invalid Coords' } });
    fireEvent.change(screen.getByLabelText(/LATITUDE/i), { target: { value: '95' } }); // > 90

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-submit-add-camera'));
    });

    expect(screen.getByText(/Latitude must be a valid number between -90 and 90/i)).toBeInTheDocument();
    expect(cameraService.createCamera).not.toHaveBeenCalled();
  });

  it('5. Edit Camera opens with pre-filled metadata and read-only camera code', () => {
    render(<CameraManagement cameras={mockCameras} />);
    const editBtn = screen.getByTestId('edit-cam-CAM-006');
    fireEvent.click(editBtn);

    expect(screen.getByTestId('edit-camera-modal')).toBeInTheDocument();
    const codeInput = screen.getByLabelText(/CAMERA ID \(READ-ONLY\)/i);
    expect(codeInput).toBeDisabled();
    expect(codeInput.value).toBe('CAM-006');

    expect(screen.getByLabelText(/CAMERA NAME \*/i).value).toBe('Camera 06');
    expect(screen.getByLabelText(/LOCATION \/ JUNCTION DESCRIPTION/i).value).toBe(
      'Timbavadi Gate / Madhuram Bypass Road, Junagadh, Gujarat, India'
    );
    expect(screen.getByLabelText(/LATITUDE/i).value).toBe('21.503');
    expect(screen.getByLabelText(/LONGITUDE/i).value).toBe('70.43');
  });

  it('6 & 7. Edit Camera updates latitude and longitude', async () => {
    const refreshMock = vi.fn();
    cameraService.updateCamera.mockResolvedValue({
      id: 6,
      camera_code: 'CAM-006',
      name: 'Camera 06 Updated',
      location: 'Junagadh Bypass',
      latitude: 21.5100,
      longitude: 70.4350,
      status: 'online',
    });

    render(<CameraManagement cameras={mockCameras} onRefreshCameras={refreshMock} />);
    fireEvent.click(screen.getByTestId('edit-cam-CAM-006'));

    fireEvent.change(screen.getByLabelText(/LATITUDE/i), { target: { value: '21.5100' } });
    fireEvent.change(screen.getByLabelText(/LONGITUDE/i), { target: { value: '70.4350' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-save-camera-edit'));
    });

    expect(cameraService.updateCamera).toHaveBeenCalledWith(
      6,
      expect.objectContaining({
        latitude: 21.5100,
        longitude: 70.4350,
      })
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it('8. Delete confirmation dialog displays explicit prompt (Delete CAM-006?)', () => {
    render(<CameraManagement cameras={mockCameras} />);
    const delBtn = screen.getByTestId('delete-cam-CAM-006');
    fireEvent.click(delBtn);

    expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete CAM-006?')).toBeInTheDocument();
    expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
  });

  it('9. Camera deletion calls delete API and updates UI via refresh', async () => {
    const refreshMock = vi.fn();
    cameraService.deleteCamera.mockResolvedValue(undefined);

    render(<CameraManagement cameras={mockCameras} onRefreshCameras={refreshMock} />);
    fireEvent.click(screen.getByTestId('delete-cam-CAM-006'));

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-confirm-delete'));
    });

    expect(cameraService.deleteCamera).toHaveBeenCalledWith(6);
    expect(refreshMock).toHaveBeenCalled();
    expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
  });

  it('10. Historical events preservation notice is clearly explained in delete confirmation', () => {
    render(<CameraManagement cameras={mockCameras} />);
    fireEvent.click(screen.getByTestId('delete-cam-CAM-001'));

    expect(
      screen.getByText(/Historical investigation events will remain preserved/i)
    ).toBeInTheDocument();
  });
});
