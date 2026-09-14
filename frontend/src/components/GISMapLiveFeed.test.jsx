import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GISMap from './GISMap';
import App from '../App';
import { cameraService } from '../api/cameraService';
import { analyticsService } from '../api/analyticsService';
import { alertService } from '../api/alertService';
import { healthService } from '../api/healthService';

// Mock React-Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="gis-map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position, eventHandlers, 'data-testid': testId }) => (
    <div
      data-testid={testId || `marker-${position[0]}-${position[1]}`}
      data-lat={position[0]}
      data-lon={position[1]}
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  Polyline: ({ positions }) => <div data-testid="polyline" data-positions={JSON.stringify(positions)} />,
  useMap: () => ({ fitBounds: vi.fn(), setView: vi.fn(), getZoom: () => 14, invalidateSize: vi.fn() }),
}));

vi.mock('../api/cameraService', () => ({
  cameraService: {
    getCameras: vi.fn(),
    getCamerasMap: vi.fn(),
    getPipelinesStatus: vi.fn(),
    startPipeline: vi.fn(),
    stopPipeline: vi.fn(),
    getPreviewUrl: vi.fn(),
    getWhepProxyUrl: vi.fn((id) => `/api/cameras/${id}/whep`),
  },
}));

vi.mock('../api/analyticsService', () => ({
  analyticsService: {
    getRecentEvents: vi.fn(),
    getVehicleTimeline: vi.fn(),
    getVehicles: vi.fn(),
  },
}));

vi.mock('../api/alertService', () => ({
  alertService: {
    getAlerts: vi.fn(),
  },
}));

vi.mock('../api/healthService', () => ({
  healthService: {
    getSystemHealth: vi.fn(),
  },
}));

const mockSixGovernmentCameras = [
  {
    id: 1,
    camera_code: 'CAM-001',
    name: 'Camera 01',
    location: 'Chimanbhai Patel Bridge, Ahmedabad, Gujarat, India',
    latitude: 23.069362,
    longitude: 72.587224,
    status: 'online',
  },
  {
    id: 2,
    camera_code: 'CAM-002',
    name: 'Camera 02',
    location: 'Janpath T Junction, Ahmedabad, Gujarat, India',
    latitude: 23.02509,
    longitude: 72.57094,
    status: 'online',
  },
  {
    id: 3,
    camera_code: 'CAM-003',
    name: 'Camera 03',
    location: 'O.N.G.C. Office / Avani Bhavan, Chandkheda, Ahmedabad, Gujarat, India',
    latitude: 23.10556,
    longitude: 72.59734,
    status: 'online',
  },
  {
    id: 4,
    camera_code: 'CAM-004',
    name: 'Camera 04',
    location: 'Paldi Circle, Ahmedabad, Gujarat, India',
    latitude: 23.0134,
    longitude: 72.5624,
    status: 'online',
  },
  {
    id: 5,
    camera_code: 'CAM-005',
    name: 'Camera 05',
    location: 'Visat Teen Rasta, Ahmedabad, Gujarat, India',
    latitude: 23.1027,
    longitude: 72.5952,
    status: 'online',
  },
  {
    id: 6,
    camera_code: 'CAM-006',
    name: 'Camera 06',
    location: 'Timbavadi Gate / Madhuram Bypass Road, Junagadh, Gujarat, India',
    latitude: 21.5030,
    longitude: 70.4300,
    status: 'online',
  },
];

describe('GIS Camera Markers & Live Feed Selection Tests (11-18)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cameraService.getCamerasMap.mockResolvedValue(mockSixGovernmentCameras);
    cameraService.getCameras.mockResolvedValue({
      cameras: mockSixGovernmentCameras,
      total: 6,
    });
    cameraService.getPipelinesStatus.mockResolvedValue({});
    analyticsService.getRecentEvents.mockResolvedValue({ events: [], total: 0 });
    alertService.getAlerts.mockResolvedValue({ alerts: [], total: 0 });
    healthService.getSystemHealth.mockResolvedValue({ status: 'ok' });
  });

  it('11. CAM-001 marker uses exact coordinates 23.069362, 72.587224', async () => {
    render(<GISMap />);
    await waitFor(() => {
      const marker = screen.getByTestId('camera-marker-CAM-001');
      expect(marker).toHaveAttribute('data-lat', '23.069362');
      expect(marker).toHaveAttribute('data-lon', '72.587224');
    });
  });

  it('12. CAM-002 marker uses exact coordinates 23.02509, 72.57094', async () => {
    render(<GISMap />);
    await waitFor(() => {
      const marker = screen.getByTestId('camera-marker-CAM-002');
      expect(marker).toHaveAttribute('data-lat', '23.02509');
      expect(marker).toHaveAttribute('data-lon', '72.57094');
    });
  });

  it('13. CAM-003 marker uses exact coordinates 23.10556, 72.59734', async () => {
    render(<GISMap />);
    await waitFor(() => {
      const marker = screen.getByTestId('camera-marker-CAM-003');
      expect(marker).toHaveAttribute('data-lat', '23.10556');
      expect(marker).toHaveAttribute('data-lon', '72.59734');
    });
  });

  it('14. CAM-004 marker uses exact coordinates 23.0134, 72.5624', async () => {
    render(<GISMap />);
    await waitFor(() => {
      const marker = screen.getByTestId('camera-marker-CAM-004');
      expect(marker).toHaveAttribute('data-lat', '23.0134');
      expect(marker).toHaveAttribute('data-lon', '72.5624');
    });
  });

  it('15. CAM-005 marker uses exact coordinates 23.1027, 72.5952', async () => {
    render(<GISMap />);
    await waitFor(() => {
      const marker = screen.getByTestId('camera-marker-CAM-005');
      expect(marker).toHaveAttribute('data-lat', '23.1027');
      expect(marker).toHaveAttribute('data-lon', '72.5952');
    });
  });

  it('16. CAM-006 marker uses exact coordinates 21.5030, 70.4300', async () => {
    render(<GISMap />);
    await waitFor(() => {
      const marker = screen.getByTestId('camera-marker-CAM-006');
      expect(marker).toHaveAttribute('data-lat', '21.503');
      expect(marker).toHaveAttribute('data-lon', '70.43');
    });
  });

  it('17. Marker click calls onSelectCamera with correct camera ID', async () => {
    const selectMock = vi.fn();
    render(<GISMap onSelectCamera={selectMock} />);

    await waitFor(() => {
      expect(screen.getByTestId('camera-marker-CAM-006')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('camera-marker-CAM-006'));
    expect(selectMock).toHaveBeenCalledWith(6);
  });

  it('18. Clicking marker in App selects camera and opens live camera panel', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('camera-marker-CAM-006')).toBeInTheDocument();
    });

    // Click marker for CAM-006
    await act(async () => {
      fireEvent.click(screen.getByTestId('camera-marker-CAM-006'));
    });

    // Focus monitor should now show CAM-006
    expect(screen.getByText('STAGE: CAM-006')).toBeInTheDocument();
    expect(
      screen.getAllByText(/Timbavadi Gate \/ Madhuram Bypass Road, Junagadh, Gujarat, India/i).length
    ).toBeGreaterThanOrEqual(1);
  });
});
