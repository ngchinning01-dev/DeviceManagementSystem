# AI-Powered Device Management System
### Project Planning Document

---

## 1. Project Overview

Managing IT devices across multiple branches can become difficult as the number of devices and users increases. Organizations often need to keep track of computers, printers, networking devices, assigned users, maintenance history, software information, and device status.

The purpose of this project is to develop a centralized web-based **Device Management System** with AI-assisted capabilities. The system will allow administrators to monitor, organize, and manage devices across different branches from a single platform.

The project also explores integrating AI tools to improve efficiency in searching, troubleshooting, and managing device-related information.

---

## 2. Problem Statement

Companies with multiple branches commonly face challenges such as:

- Difficulty tracking device locations
- Lack of centralized device records
- Poor maintenance tracking
- Manual reporting processes
- Slow troubleshooting and support response
- Device information scattered across different sources

Without a proper management system, administrators may spend excessive time managing and locating device information.

---

## 3. Project Objectives

- Develop a centralized device management platform
- Manage devices across multiple branches
- Record and track device information
- Monitor maintenance and issue history
- Improve IT management efficiency
- Integrate AI features for intelligent assistance

---

## 4. Proposed System Features

### 4.1 Branch Management
- Add, edit, and remove branch information
- View branch details
- Track devices under each branch

### 4.2 Device Management
- Register devices
- Edit device information
- Track device status
- Assign devices to users

### 4.3 User Assignment
- Assign employees to devices
- Track ownership history

### 4.4 Maintenance Management
- Record device issues
- Store repair history
- Log maintenance actions

### 4.5 Dashboard
- Display total devices
- Device status overview
- Branch statistics
- Maintenance summary

### 4.6 AI Assistant Features

**Natural Language Search**
```
User:  "Show all laptops in Branch A"
AI:    "I found 15 laptops in Branch A"
```

**Troubleshooting Assistance**
```
User:  "Printer in Branch B keeps disconnecting"
AI:    "Possible causes: Network issue, Driver problem, IP Conflict, Hardware issue"
```

---

## 5. Proposed System Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React / Next.js |
| Backend | Flask REST API |
| Database (Dev) | SQLite |
| Database (Prod) | MySQL or PostgreSQL |
| AI Integration | Claude API or other LLM APIs |

---

## 6. Database Design (Current)

### Branch
| Field | Type | Notes |
|-------|------|-------|
| Branch_ID | String (PK) | |
| Branch_Name | String | Required |
| Location | String | |

### User
| Field | Type | Notes |
|-------|------|-------|
| User_ID | String (PK) | |
| Name | String | Required |
| Email | String | Unique, Required |
| Department | String | |

### Device
| Field | Type | Notes |
|-------|------|-------|
| Device_ID | String (PK) | |
| Device_Name | String | Required |
| Device_Type | String | Required |
| Serial_Number | String | |
| IP_Address | String | |
| Status | String | Default: Active |
| Branch_ID | String (FK → Branch) | Required |
| Assigned_User_ID | String (FK → User) | Nullable |
| Purchase_Date | Date | Nullable |
| Warranty_Expiry | Date | Nullable |
| Cost | Float | Nullable |

### Maintenance
| Field | Type | Notes |
|-------|------|-------|
| Maintenance_ID | String (PK) | |
| Device_ID | String (FK → Device) | Required |
| Issue | String | Required |
| Solution | String | Nullable |
| Date | Date | Default: today |

### Admin
| Field | Type | Notes |
|-------|------|-------|
| ID | Integer (PK) | Auto-increment |
| Username | String | Unique, Required |
| Password_Hash | String | bcrypt hashed |

---

## 7. Expected Outcomes

Upon completion, the system is expected to:

- Simplify device management
- Reduce administrative workload
- Improve maintenance tracking
- Provide centralized information access
- Support faster troubleshooting through AI assistance

---

## 8. Future Enhancements

- Automatic device discovery
- Real-time monitoring
- Software inventory management
- Email notifications
- QR code tagging for devices
- Predictive maintenance using machine learning
