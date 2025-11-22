## Traveler Backend Repository (Traveler)

# Traveler – Backend Server

This repository contains the **backend server** for the Traveler platform, a **social platform for travel enthusiasts**. It handles **user authentication, travel story storage, route management, gamification logic, notifications, and social feed functionality**.

**Frontend repository:** [Traveler Frontend](https://github.com/hammadmeer-dev/traveler_client)
**ML Model repository:** [Travel-Advisor](https://github.com/hammadmeer-dev/Travel-Advisor)

---

## Visit Online : [Traveler](https://truetraveler.netlify.app)
---
## System Overview

* **Backend:** Node.js + Express.js
* **Database:** MongoDB
* **Authentication:** JWT-based secure login/signup
* **API:** RESTful endpoints consumed by frontend
* **Notifications & Social Feed:** Real-time updates via socket.io
* **Integration:** Calls the ML engine in [Travel-Advisor](https://github.com/hammadmeer-dev/Travel-Advisor) for AI-powered destination recommendations

---

## Requirements

* Node.js (LTS recommended)
* npm or yarn
* MongoDB (local or cloud)
* Running ML engine ([Travel-Advisor](https://github.com/hammadmeer-dev/Travel-Advisor))

---

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/hammadmeer-dev/Traveler.git
cd Traveler
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Configure environment variables** (`.env`)

```
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
ML_API_URL=http://localhost:5001
```

4. **Start the backend**

```bash
npm run dev
# or
yarn dev
```

The API runs on `http://localhost:5000` by default.

---

## Features

* User authentication (signup/login)
* Travel stories CRUD
* Gamification (badges, ranks)
* Social feed (like, comment, follow)
* Notifications (real-time)
* AI-powered recommendations via ML engine

---

## Contribution

* Fork → Branch → Commit → Push → Pull Request

---

## License

MIT License

---

## Contact

Hammad Farooq Meer – [GitHub](https://github.com/hammadmeer-dev)

## Travel-Advisor Repository (ML)

# Travel-Advisor – AI/ML Engine for Traveler Platform

This repository contains the **machine learning engine** for the Traveler platform. It provides **AI-powered travel recommendations** used by the backend server ([Traveler](https://github.com/hammadmeer-dev/Traveler)).

**Frontend repository:** [Traveler Frontend](https://github.com/hammadmeer-dev/traveler_client)
**Backend repository:** [Traveler Backend](https://github.com/hammadmeer-dev/Traveler)

---

## Overview

* **ML Algorithm:** K-Nearest Neighbors (KNN) with Cosine Similarity
* **Inputs:** district (e.g., Punjab, KPK, Sindh), category (e.g., Fort, Valley, Museum)
* **Outputs:** Top 5 recommended destinations
* **Tools:** Python, Flask, Scikit-learn, Pandas, NumPy, SentenceTransformer
* **Data:** `Tourist Destinations.csv`

> This engine is minimal in functionality but can be expanded. Contributions are welcome.

---

## Requirements

* Python 3.x
* Flask, Scikit-learn, Pandas, NumPy, SentenceTransformer

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Running the ML Engine

1. **Clone the repository**

```bash
git clone https://github.com/hammadmeer-dev/Travel-Advisor.git
cd Travel-Advisor
```

2. **Start Flask server**

```bash
python app.py
```

3. **Connect with Backend**
   Ensure the backend ([Traveler](https://github.com/hammadmeer-dev/Traveler)) points to the ML API (`ML_API_URL=http://localhost:5001`) to fetch AI recommendations.

---

## Contribution

* Fork → Branch → Commit → Push → Pull Request

---

## License

MIT License

---

## Contact

Hammad Farooq Meer – [GitHub](https://github.com/hammadmeer-dev)
