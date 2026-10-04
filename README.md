# HostelDesk V5 — Guest / Short Stay Feature

Added Guest management while keeping the existing student, OCR, KYC proof, monthly payment, history, checkout, bed availability and print features.

## Guest workflow
- Add Guest uses the same personal/KYC fields as Student.
- Front + Back proof capture/upload and OCR are available.
- Manual short-stay fields: Room Number, Floor, Bed, Stay Amount, Stay Days, Check-in Date.
- Expected Check-out is calculated automatically from Check-in + Stay Days.
- Example: 1 or 3 day guest stay.
- Existing room/bed must exist and be available; floor must match the selected room.
- Saving a guest marks the bed Occupied.
- Guest checkout releases the bed to Available.
- Checked-out guests remain in Guest History.
- Guest profile supports Edit while active and shows KYC proof images.
