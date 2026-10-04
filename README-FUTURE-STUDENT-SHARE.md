# HostelDesk – Student Profile History & WhatsApp Share

Added for the customer dashboard:

- Dashboard **Students** card opens the complete Students list.
- Every student name opens the full Student Profile.
- Student Profile shows personal/KYC details, room/bed, payment history, and saved front/back proof images.
- Payment history is loaded for the selected student and shows date, month, amount and note.
- Print keeps the existing Student Profile print workflow and proof images.
- New **📲 Share** button opens a WhatsApp number entry screen and prepares a message containing student details and complete payment history.
- WhatsApp browser sharing uses a pre-filled `wa.me` message. A normal browser `wa.me` link cannot attach local proof image files automatically; the saved proofs remain available in the profile for viewing/download. Automatic media attachment requires an official WhatsApp Business API/media-storage integration.
- All API payment queries remain tenant-isolated by the logged-in customer account.
