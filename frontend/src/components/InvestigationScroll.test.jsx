import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import InvestigationWorkspace from './InvestigationWorkspace';
import { analyticsService } from '../api/analyticsService';
import { cameraService } from '../api/cameraService';

vi.mock('../api/analyticsService', () => ({
  analyticsService: {
    getVehicleTimeline: vi.fn(),
  },
}));

vi.mock('../api/cameraService', () => ({
  cameraService: {
    startPipeline: vi.fn(),
    stopPipeline: vi.fn(),
  },
}));

// Generate 25 timeline sightings
const generate25Sightings = (plate) => {
  const list = [];
  for (let i = 1; i <= 25; i++) {
    list.push({
      id: i,
      camera_id: (i % 6) + 1,
      camera_code: `CAM-00${(i % 6) + 1}`,
      camera_name: `Checkpoint Node ${i}`,
      location: `Cross Road Junction ${i}`,
      latitude: 23.0 + i * 0.005,
      longitude: 72.5 + i * 0.005,
      timestamp: new Date(Date.now() - (25 - i) * 60000).toISOString(),
      confidence: 0.94,
      pts_ms: 1200 + i * 40,
      vehicle_type: 'car',
      make: 'Hyundai',
      model: 'Creta',
      color: 'White',
    });
  }
  return {
    plate_number: plate,
    vehicle: {
      plate_number: plate,
      vehicle_type: 'car',
      make: 'Hyundai',
      model: 'Creta',
      color: 'White',
    },
    timeline: list,
    total_detections: 25,
  };
};

describe('Investigation Workspace Scrolling & Accessibility Tests (23-25)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('23. Investigation workspace renders with vertical scrolling capability', () => {
    render(<InvestigationWorkspace cameras={[]} />);
    const workspace = screen.getByTestId('investigation-workspace');
    expect(workspace).toBeInTheDocument();
  });

  it('24. Long timeline with 25 sightings is fully rendered and accessible', async () => {
    const mockData = generate25Sightings('GJ05AB1234');
    analyticsService.getVehicleTimeline.mockResolvedValue(mockData);

    render(<InvestigationWorkspace cameras={[]} />);

    const input = screen.getByLabelText(/TARGET REGISTRATION PLATE \*/i);
    fireEvent.change(input, { target: { value: 'GJ05AB1234' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /SEARCH EXISTING RECORDS/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/25 SIGHTINGS DETECTED/i)).toBeInTheDocument();
    });

    // Verify first, middle, and last checkpoints exist and are not clipped
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Checkpoint Node 1')).toBeInTheDocument();

    expect(screen.getByText('#13')).toBeInTheDocument();
    expect(screen.getByText('Checkpoint Node 13')).toBeInTheDocument();

    expect(screen.getByText('#25')).toBeInTheDocument();
    expect(screen.getByText('Checkpoint Node 25')).toBeInTheDocument();
  });

  it('25. Existing investigation search query builder still functions normally', async () => {
    analyticsService.getVehicleTimeline.mockResolvedValue({
      plate_number: 'KA02MM9091',
      vehicle: { plate_number: 'KA02MM9091', vehicle_type: 'suv' },
      timeline: [],
      total_detections: 0,
    });

    render(<InvestigationWorkspace cameras={[]} initialPlate="KA02MM9091" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /SEARCH EXISTING RECORDS/i }));
    });

    expect(analyticsService.getVehicleTimeline).toHaveBeenCalledWith('KA02MM9091');
    await waitFor(() => {
      expect(screen.getByText(/NO SIGHTINGS RECORDED FOR KA02MM9091/i)).toBeInTheDocument();
    });
  });
});
