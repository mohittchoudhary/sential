import React, { useState, useMemo } from 'react';
import { cameraService } from '../api/cameraService';

export default function CameraManagement({
  cameras = [],
  onRefreshCameras = null,
  onSelectCamera = null,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [deletingCamera, setDeletingCamera] = useState(null);

  // Form states for Add Camera
  const [addFormData, setAddFormData] = useState({
    camera_code: '',
    name: '',
    location: '',
    latitude: '',
    longitude: '',
    stream_id_or_url: '',
    vendor: 'Gujarat Police Traffic Branch',
  });
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states for Edit Camera
  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
    latitude: '',
    longitude: '',
    status: 'online',
  });
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // State for Delete Confirmation
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Filtered camera list
  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (cam.camera_code && cam.camera_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cam.name && cam.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cam.location && cam.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (cam.status && cam.status.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [cameras, searchTerm, statusFilter]);

  // Open Edit Modal
  const handleOpenEdit = (cam) => {
    setEditingCamera(cam);
    setEditFormData({
      name: cam.name || '',
      location: cam.location || '',
      latitude: cam.latitude !== null && cam.latitude !== undefined ? String(cam.latitude) : '',
      longitude: cam.longitude !== null && cam.longitude !== undefined ? String(cam.longitude) : '',
      status: cam.status || 'online',
    });
    setEditError(null);
    setEditSuccess(null);
  };

  // Submit Edit Camera
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCamera) return;
    setEditError(null);
    setEditSuccess(null);

    const name = editFormData.name.trim();
    if (!name) {
      setEditError('Camera name is required.');
      return;
    }

    // Validate coordinates
    let lat = null;
    let lon = null;
    if (editFormData.latitude !== '') {
      const parsedLat = parseFloat(editFormData.latitude);
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        setEditError('Latitude must be a valid number between -90 and 90 degrees.');
        return;
      }
      lat = parsedLat;
    }
    if (editFormData.longitude !== '') {
      const parsedLon = parseFloat(editFormData.longitude);
      if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
        setEditError('Longitude must be a valid number between -180 and 180 degrees.');
        return;
      }
      lon = parsedLon;
    }

    const payload = {
      name,
      location: editFormData.location.trim() || null,
      latitude: lat,
      longitude: lon,
      status: editFormData.status,
    };

    setIsSavingEdit(true);
    try {
      await cameraService.updateCamera(editingCamera.id, payload);
      setEditSuccess(`Camera ${editingCamera.camera_code} updated successfully.`);
      if (onRefreshCameras) {
        await onRefreshCameras();
      }
      setTimeout(() => {
        setEditingCamera(null);
      }, 700);
    } catch (err) {
      setEditError(err.message || 'Failed to update camera.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Submit Add Camera
  const handleCreateCamera = async (e) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    const code = addFormData.camera_code.trim().toUpperCase();
    const name = addFormData.name.trim();

    if (!code) {
      setAddError('Camera code is required (e.g. CAM-009).');
      return;
    }
    if (!name) {
      setAddError('Camera name is required.');
      return;
    }

    const rawStream = addFormData.stream_id_or_url.trim();

    // Security check: NEVER allow credentials in stream URL
    if (rawStream && (rawStream.includes('@') || /:\/\/[^/]+:[^/]+@/.test(rawStream))) {
      setAddError(
        'SECURITY PROTOCOL: RTSP credentials must never be entered in camera forms. Credentials remain server-side only.'
      );
      return;
    }

    let sanitizedStreamUrl = null;
    if (rawStream) {
      if (rawStream.startsWith('rtsp://') || rawStream.startsWith('http://') || rawStream.startsWith('https://')) {
        sanitizedStreamUrl = rawStream;
      } else {
        const cleanId = rawStream.replace(/^\/+/, '');
        sanitizedStreamUrl = `rtsp://103.250.160.189:8554/stream/${cleanId}`;
      }
    }

    let lat = null;
    let lon = null;
    if (addFormData.latitude !== '') {
      const parsedLat = parseFloat(addFormData.latitude);
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        setAddError('Latitude must be a valid number between -90 and 90 degrees.');
        return;
      }
      lat = parsedLat;
    }
    if (addFormData.longitude !== '') {
      const parsedLon = parseFloat(addFormData.longitude);
      if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
        setAddError('Longitude must be a valid number between -180 and 180 degrees.');
        return;
      }
      lon = parsedLon;
    }

    const payload = {
      camera_code: code,
      name,
      location: addFormData.location.trim() || null,
      latitude: lat,
      longitude: lon,
      stream_url: sanitizedStreamUrl,
      status: 'offline',
      vendor: addFormData.vendor.trim() || null,
    };

    setIsAdding(true);
    try {
      const created = await cameraService.createCamera(payload);
      setAddSuccess(`Camera ${created.camera_code || code} registered successfully.`);
      if (onRefreshCameras) {
        await onRefreshCameras();
      }
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddFormData({
          camera_code: '',
          name: '',
          location: '',
          latitude: '',
          longitude: '',
          stream_id_or_url: '',
          vendor: 'Gujarat Police Traffic Branch',
        });
      }, 700);
    } catch (err) {
      setAddError(err.message || 'Failed to register camera. Code may already exist.');
    } finally {
      setIsAdding(false);
    }
  };

  // Submit Delete Camera
  const handleConfirmDelete = async () => {
    if (!deletingCamera) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await cameraService.deleteCamera(deletingCamera.id);
      if (onRefreshCameras) {
        await onRefreshCameras();
      }
      setDeletingCamera(null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete camera.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="camera-management-workspace" data-testid="camera-management-page">
      {/* 1. MANAGEMENT HEADER & TOOLBAR */}
      <div className="camera-mgmt-header">
        <div className="mgmt-title-block">
          <h2>CAMERA MANAGEMENT</h2>
          <span className="mgmt-subtitle">
            CCTV NODE REGISTRY & INFRASTRUCTURE CONFIGURATION ({cameras.length} NODES REGISTERED)
          </span>
        </div>

        <div className="mgmt-toolbar-actions">
          <div className="mgmt-search-box">
            <input
              type="text"
              className="c2-input mgmt-search-input"
              placeholder="Filter by ID, name, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="camera-search-input"
            />
          </div>

          <select
            className="c2-select mgmt-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="camera-status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="degraded">Degraded</option>
          </select>

          <button
            type="button"
            className="btn btn-primary btn-add-camera-action"
            onClick={() => {
              setAddError(null);
              setAddSuccess(null);
              setIsAddModalOpen(true);
            }}
            data-testid="btn-add-camera"
          >
            + ADD CAMERA
          </button>
        </div>
      </div>

      {/* 2. CAMERA INVENTORY TABLE */}
      <div className="camera-table-container">
        <table className="camera-table" data-testid="camera-table">
          <thead>
            <tr>
              <th>CAMERA ID</th>
              <th>CAMERA NAME</th>
              <th>LOCATION</th>
              <th>LATITUDE</th>
              <th>LONGITUDE</th>
              <th>STATUS</th>
              <th>STREAM AVAILABILITY</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCameras.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table-cell">
                  {cameras.length === 0
                    ? 'No cameras registered in Sentinel system.'
                    : 'No cameras match current filter criteria.'}
                </td>
              </tr>
            ) : (
              filteredCameras.map((cam) => {
                const isOnline = cam.status === 'online';
                const hasStream = Boolean(cam.stream_url);

                return (
                  <tr key={cam.id} data-testid={`camera-row-${cam.camera_code}`}>
                    <td className="cell-camera-code">
                      <span className="mgmt-code-pill">{cam.camera_code}</span>
                    </td>
                    <td className="cell-camera-name">
                      <strong>{cam.name}</strong>
                    </td>
                    <td className="cell-camera-location">
                      {cam.location || <span className="text-muted">Unmapped</span>}
                    </td>
                    <td className="cell-coords font-mono">
                      {cam.latitude !== null && cam.latitude !== undefined
                        ? Number(cam.latitude).toFixed(6)
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="cell-coords font-mono">
                      {cam.longitude !== null && cam.longitude !== undefined
                        ? Number(cam.longitude).toFixed(6)
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="cell-status">
                      <span className={`status-pill ${isOnline ? 'status-live' : 'status-offline'}`}>
                        <span className="dot"></span>
                        {cam.status ? cam.status.toUpperCase() : 'OFFLINE'}
                      </span>
                    </td>
                    <td className="cell-stream">
                      <span className={`stream-avail-badge ${hasStream ? 'stream-configured' : 'stream-none'}`}>
                        {hasStream ? 'Stream: Configured' : 'Stream: Not configured'}
                      </span>
                    </td>
                    <td className="cell-actions" style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-secondary btn-mgmt-edit"
                        onClick={() => handleOpenEdit(cam)}
                        data-testid={`edit-cam-${cam.camera_code}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-danger btn-mgmt-delete"
                        onClick={() => {
                          setDeletingCamera(cam);
                          setDeleteError(null);
                        }}
                        style={{ marginLeft: '6px' }}
                        data-testid={`delete-cam-${cam.camera_code}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. EDIT CAMERA MODAL */}
      {editingCamera && (
        <div className="command-modal-overlay" role="dialog" aria-modal="true" data-testid="edit-camera-modal">
          <div className="command-modal-window edit-camera-window">
            <div className="command-modal-header">
              <div>
                <h3>EDIT CAMERA • {editingCamera.camera_code}</h3>
                <span className="modal-header-sub">UPDATE JUNCTION METADATA & SURVEY COORDINATES</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingCamera(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="command-modal-body">
              {editError && (
                <div className="error-banner" role="alert">
                  <strong>Error: </strong> {editError}
                </div>
              )}

              {editSuccess && (
                <div className="success-banner" role="alert">
                  {editSuccess}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="edit-camera-form">
                {/* Camera Code is READ-ONLY per Correction 1 */}
                <div className="form-field">
                  <label htmlFor="edit_camera_code">CAMERA ID (READ-ONLY)</label>
                  <input
                    id="edit_camera_code"
                    type="text"
                    value={editingCamera.camera_code}
                    disabled
                    className="input-disabled"
                    title="Camera ID is stable and immutable to preserve historical detection links"
                  />
                  <small className="field-hint">Hardware identifier is immutable to preserve historical audit events.</small>
                </div>

                <div className="form-field">
                  <label htmlFor="edit_name">CAMERA NAME *</label>
                  <input
                    id="edit_name"
                    name="name"
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="edit_location">LOCATION / JUNCTION DESCRIPTION</label>
                  <input
                    id="edit_location"
                    name="location"
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    placeholder="e.g. Chimanbhai Patel Bridge, Ahmedabad, Gujarat, India"
                  />
                </div>

                <div className="form-row-grid">
                  <div className="form-field">
                    <label htmlFor="edit_latitude">LATITUDE (GPS -90 to 90)</label>
                    <input
                      id="edit_latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g. 23.069362"
                      value={editFormData.latitude}
                      onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="edit_longitude">LONGITUDE (GPS -180 to 180)</label>
                    <input
                      id="edit_longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g. 72.587224"
                      value={editFormData.longitude}
                      onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="edit_status">OPERATIONAL STATUS</label>
                  <select
                    id="edit_status"
                    name="status"
                    className="c2-select"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="degraded">Degraded</option>
                  </select>
                </div>

                <div className="modal-actions-deck">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingCamera(null)}
                    disabled={isSavingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSavingEdit}
                    data-testid="btn-save-camera-edit"
                  >
                    {isSavingEdit ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADD CAMERA MODAL */}
      {isAddModalOpen && (
        <div className="command-modal-overlay" role="dialog" aria-modal="true" data-testid="add-camera-modal">
          <div className="command-modal-window add-camera-window">
            <div className="command-modal-header">
              <div>
                <h3>CAMERA MANAGEMENT • ONBOARD NODE</h3>
                <span className="modal-header-sub">REGISTER CCTV SENSOR NODE TO GUJARAT POLICE SURVEILLANCE GRID</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="command-modal-body">
              <div className="security-notice-banner">
                <span className="notice-tag">[SECURITY PROTOCOL]</span>
                <span>Zero-Credential Storage: Credentials must remain server-side. Do not enter RTSP passwords.</span>
              </div>

              {addError && (
                <div className="error-banner" role="alert">
                  <strong>Error: </strong> {addError}
                </div>
              )}

              {addSuccess && (
                <div className="success-banner" role="alert">
                  {addSuccess}
                </div>
              )}

              <form onSubmit={handleCreateCamera} className="add-camera-form">
                <div className="form-row-grid">
                  <div className="form-field">
                    <label htmlFor="add_camera_code">CAMERA ID *</label>
                    <input
                      id="add_camera_code"
                      name="camera_code"
                      type="text"
                      placeholder="e.g. CAM-009"
                      value={addFormData.camera_code}
                      onChange={(e) => setAddFormData({ ...addFormData, camera_code: e.target.value })}
                      required
                      autoFocus
                    />
                    <small className="field-hint">Unique hardware identifier</small>
                  </div>

                  <div className="form-field">
                    <label htmlFor="add_name">CAMERA NAME *</label>
                    <input
                      id="add_name"
                      name="name"
                      type="text"
                      placeholder="e.g. Kalupur Station Circle"
                      value={addFormData.name}
                      onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-grid">
                  <div className="form-field">
                    <label htmlFor="add_location">LOCATION / JUNCTION</label>
                    <input
                      id="add_location"
                      name="location"
                      type="text"
                      placeholder="e.g. Ahmedabad, Gujarat, India"
                      value={addFormData.location}
                      onChange={(e) => setAddFormData({ ...addFormData, location: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="add_vendor">DEPARTMENT / VENDOR</label>
                    <input
                      id="add_vendor"
                      name="vendor"
                      type="text"
                      placeholder="e.g. Gujarat Police Traffic Branch"
                      value={addFormData.vendor}
                      onChange={(e) => setAddFormData({ ...addFormData, vendor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-grid">
                  <div className="form-field">
                    <label htmlFor="add_latitude">LATITUDE (GPS -90 to 90)</label>
                    <input
                      id="add_latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g. 23.02509"
                      value={addFormData.latitude}
                      onChange={(e) => setAddFormData({ ...addFormData, latitude: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="add_longitude">LONGITUDE (GPS -180 to 180)</label>
                    <input
                      id="add_longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g. 72.57094"
                      value={addFormData.longitude}
                      onChange={(e) => setAddFormData({ ...addFormData, longitude: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="add_stream_id">STREAM IDENTIFIER (SANITIZED)</label>
                  <input
                    id="add_stream_id"
                    name="stream_id_or_url"
                    type="text"
                    placeholder="e.g. cam09 or rtsp://103.250.160.189:8554/stream/cam09"
                    value={addFormData.stream_id_or_url}
                    onChange={(e) => setAddFormData({ ...addFormData, stream_id_or_url: e.target.value })}
                  />
                  <small className="field-hint">
                    Enter stream identifier. Never enter RTSP passwords or credentials.
                  </small>
                </div>

                <div className="modal-actions-deck">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={isAdding}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isAdding}
                    data-testid="btn-submit-add-camera"
                  >
                    {isAdding ? 'Registering...' : 'Register Camera'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION MODAL */}
      {deletingCamera && (
        <div className="command-modal-overlay" role="dialog" aria-modal="true" data-testid="delete-confirmation-dialog">
          <div className="command-modal-window delete-camera-window" style={{ maxWidth: '440px' }}>
            <div className="command-modal-header delete-modal-header">
              <div>
                <h3 style={{ color: '#DC2626' }}>Delete {deletingCamera.camera_code}?</h3>
                <span className="modal-header-sub">CONFIRM NODE DEREGISTRATION</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeletingCamera(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="command-modal-body">
              {deleteError && (
                <div className="error-banner" role="alert">
                  <strong>Error: </strong> {deleteError}
                </div>
              )}

              <p style={{ fontSize: '0.85rem', color: '#172B4D', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                Are you sure you want to delete <strong>{deletingCamera.camera_code}</strong> ({deletingCamera.name})?
              </p>
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: '#991B1B',
                  marginBottom: '1rem',
                  lineHeight: 1.4,
                }}
              >
                <strong>Warning:</strong> Deletion removes this camera node from the active Sentinel camera registry, live surveillance grid, and GIS tactical map. Historical investigation events will remain preserved.
              </div>

              <div className="modal-actions-deck" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeletingCamera(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  data-testid="btn-confirm-delete"
                >
                  {isDeleting ? 'Deleting...' : `Delete ${deletingCamera.camera_code}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
