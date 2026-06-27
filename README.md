# UPM Campus Hazard Detective

Real-time campus hazard detection prototype: **Expo SDK 54** mobile frontend + **Flask/YOLO/Gemini** backend.

## Structure

```
ML_Hazard_App/
├── backend/          # Flask API, YOLO inference, Gemini recommendations
│   ├── server.py
│   ├── models/best.pt
│   └── .env          # not committed — copy from .env.example
└── frontend/         # Expo React Native app (Expo Go SDK 54)
    ├── App.js
    └── screens/
```

## Quick start

### Backend (laptop)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add your GEMINI_API_KEY
python server.py
```

Server runs at `http://0.0.0.0:5000`.

### Frontend (phone via Expo Go)

1. Set your laptop Wi-Fi IP in `frontend/App.js` (`LAPTOP_IP_ADDRESS`).
2. `cd frontend && npm install && npx expo start`
3. Scan the QR code with **Expo Go** (SDK 54) on the same network.

## API

`POST /detect-hazard` — multipart form field `image` → JSON with YOLO metrics, base64 annotated image, and Gemini maintenance recommendation.

## License

MIT — see [LICENSE](LICENSE).
