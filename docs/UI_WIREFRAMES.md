# UI Wireframe Descriptions

## 1. Login Page

### Layout
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              [Logo: Brain Icon]                         │
│           Handwritten Character Recognition              │
│                                                         │
│              Sign in to your account                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Username                                        │  │
│  │ [_____________________________]                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Password                                        │  │
│  │ [_____________________________]                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│              [Sign In]                                  │
│                                                         │
│         Don't have an account? Register                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Demo Credentials:                               │  │
│  │ Admin: admin / admin123                         │  │
│  │ Researcher: researcher / researcher123           │  │
│  │ User: user / user123                            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components
- **Logo**: Brain icon with blue color scheme
- **Title**: "Handwritten Character Recognition"
- **Subtitle**: "Sign in to your account"
- **Form Fields**: Username and password inputs with labels
- **Submit Button**: "Sign In" button (primary color)
- **Link**: "Register" for new users
- **Demo Credentials Box**: Shows default login credentials

### Interactions
- Enter credentials and click "Sign In" to authenticate
- Click "Register" to navigate to registration page
- Form validation for empty fields
- Error message display for invalid credentials

---

## 2. Dashboard Page

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] HDC System    [Home] [Draw] [Upload] [History] │
│                       [Analytics] [Training] [Admin]    │
│  admin (admin)                                          │
│                    [Logout]                             │
└─────────────────────────────────────────────────────────┘
│                                                         │
│  Dashboard                                              │
│  Overview of your character recognition activity        │
│                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐│
│  │ Total      │ │ Accuracy   │ │ Avg        │ │ Correct││
│  │ Predictions│ │            │ │ Confidence │ │ Preds  ││
│  │    1250    │ │   94.4%    │ │   92.0%    │ │  1180  ││
│  │ [Brain]    │ │ [Check]    │ │ [Trending] │ │[Activity]││
│  └────────────┘ └────────────┘ └────────────┘ └────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Draw Character                      │  │
│  │         Draw a character on canvas...           │  │
│  │                  [Brain]                         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Upload Image                        │  │
│  │         Upload an image for recognition...       │  │
│  │                 [Activity]                       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │              View Analytics                      │  │
│  │         Explore detailed analytics...           │  │
│  │                 [Trending]                       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Recent Predictions                                     │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [A] Character: A  Confidence: 95.0%  2024-01-01 │  │
│  │ [5] Character: 5  Confidence: 88.0%  2024-01-01 │  │
│  │ [B] Character: B  Confidence: 92.0%  2024-01-01 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components
- **Navigation Bar**: Logo, menu items, user info, logout
- **Stats Cards**: 4 cards showing key metrics with icons
- **Quick Actions**: 3 clickable cards for main actions
- **Recent Predictions**: Table showing last 10 predictions

### Interactions
- Click navigation items to navigate to different pages
- Click quick action cards to navigate to respective pages
- View recent predictions with character, confidence, and date

---

## 3. Drawing Canvas Page

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] HDC System    [Home] [Draw] [Upload] [History] │
│                       [Analytics] [Training] [Admin]    │
│  admin (admin)                                          │
│                    [Logout]                             │
└─────────────────────────────────────────────────────────┘
│                                                         │
│  Draw Character                                         │
│  Draw a digit or alphabet character on the canvas      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Drawing Canvas                                 │  │
│  │                                                 │  │
│  │                                                 │  │
│  │              [White Canvas Area]                │  │
│  │                                                 │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Clear] [Download]                                     │
│                                                         │
│              [Predict Character]                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Prediction Result                              │  │
│  │                                                 │  │
│  │              [A]                                 │  │
│  │         Predicted Character                     │  │
│  │         Confidence: 95.00%                       │  │
│  │                                                 │  │
│  │  Top Predictions:                               │  │
│  │  [A] 95.00%  [4] 3.00%  [H] 1.00%             │  │
│  │  [K] 0.50%   [R] 0.50%                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components
- **Canvas Area**: 500x500 pixel white drawing area
- **Toolbar**: Clear and Download buttons
- **Predict Button**: Main action button
- **Result Panel**: Shows predicted character with confidence
- **Top Predictions**: List of top 5 predictions with percentages

### Interactions
- Draw on canvas using mouse/touch
- Click "Clear" to reset canvas
- Click "Download" to save drawing as image
- Click "Predict Character" to get prediction
- View results in the result panel

---

## 4. Upload Image Page

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] HDC System    [Home] [Draw] [Upload] [History] │
│                       [Analytics] [Training] [Admin]    │
│  admin (admin)                                          │
│                    [Logout]                             │
└─────────────────────────────────────────────────────────┘
│                                                         │
│  Upload Image                                           │
│  Upload an image containing a handwritten character      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                 │  │
│  │          [Upload Icon]                          │  │
│  │                                                 │  │
│  │  Click to upload or drag and drop              │  │
│  │  PNG, JPG, JPEG (MAX. 5MB)                      │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  (After upload)                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                 │  │
│  │              [Image Preview]                    │  │
│  │                  [X]                             │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│              [Remove] [Predict]                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Prediction Result                              │  │
│  │                                                 │  │
│  │              [5]                                 │  │
│  │         Predicted Character                     │  │
│  │         Confidence: 88.00%                       │  │
│  │                                                 │  │
│  │  Top Predictions:                               │  │
│  │  [5] 88.00%  [S] 8.00%  [2] 2.00%             │  │
│  │  [Z] 1.00%   [3] 1.00%                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components
- **Upload Area**: Drag-and-drop zone with upload icon
- **Image Preview**: Shows uploaded image with remove button
- **Action Buttons**: Remove and Predict buttons
- **Result Panel**: Same as canvas page

### Interactions
- Click upload area or drag-and-drop image
- Preview uploaded image
- Click "Remove" to clear image
- Click "Predict" to get prediction
- View results in result panel

---

## 5. Prediction History Page

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] HDC System    [Home] [Draw] [Upload] [History] │
│                       [Analytics] [Training] [Admin]    │
│  admin (admin)                                          │
│                    [Logout]                             │
└─────────────────────────────────────────────────────────┘
│                                                         │
│  Prediction History                                     │
│  View all your past predictions                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Image  │ Character │ Confidence │ Method │ Date  │  │
│  ├────────┼───────────┼────────────┼────────┼───────│  │
│  │ [img]  │    [A]    │   95.00%    │ Canvas │ 01/01 │  │
│  │        │           │             │        │       │  │
│  │ [View] │           │             │        │       │  │
│  ├────────┼───────────┼────────────┼────────┼───────│  │
│  │ [img]  │    [5]    │   88.00%    │ Upload │ 01/01 │  │
│  │        │           │             │        │       │  │
│  │ [View] │           │             │        │       │  │
│  ├────────┼───────────┼────────────┼────────┼───────│  │
│  │ [img]  │    [B]    │   92.00%    │ Canvas │ 01/01 │  │
│  │        │           │             │        │       │  │
│  │ [View] │           │             │        │       │  │
│  └────────┴───────────┴────────────┴────────┴───────┘  │
│                                                         │
│  [Previous] [1, 2, 3] [Next]                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components
- **Table**: Shows all predictions with image, character, confidence, method, date
- **Pagination**: Navigate through pages of predictions
- **View Button**: Opens detailed prediction modal

### Interactions
- Click "View" to see detailed prediction information
- Use pagination to navigate through predictions
- Sort by columns (future enhancement)
- Filter by date range (future enhancement)

---

## 6. Analytics Dashboard

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] HDC System    [Home] [Draw] [Upload] [History] │
│                       [Analytics] [Training] [Admin]    │
│  admin (admin)                                          │
│                    [Logout]                             │
└─────────────────────────────────────────────────────────┘
│                                                         │
│  Analytics Dashboard                                    │
│  Visual insights into your character recognition data    │
│                                                         │
│  ┌─────────────────────────────┐ ┌─────────────────────┐│
│  │ [Bar Chart]                │ │ [Line Chart]        ││
│  │ Character Frequency         │ │ Predictions Over    ││
│  │ Distribution               │ │ Time                ││
│  │                             │ │                     ││
│  │ [Bar Graph Visualization]   │ │ [Line Graph]        ││
│  └─────────────────────────────┘ └─────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [Histogram]                                    │  │
│  │ Confidence Score Distribution                  │  │
│  │                                                 │  │
│  │ [Histogram Visualization]                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components
- **Character Frequency Chart**: Bar chart showing prediction distribution
- **Prediction Timeline**: Line chart showing predictions over time
- **Confidence Distribution**: Histogram showing confidence score distribution

### Interactions
- Hover over charts to see detailed values
- Zoom in/out on charts
- Download charts as images
- Filter by date range (future enhancement)

---

## 7. Admin Panel

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] HDC System    [Home] [Draw] [Upload] [History] │
│                       [Analytics] [Training] [Admin]    │
│  admin (admin)                                          │
│                    [Logout]                             │
└─────────────────────────────────────────────────────────┘
│                                                         │
│  Admin Panel                                            │
│  Manage users and system settings                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [Users] User Management                          │  │
│  │                                                 │  │
│  │ Username │ Email │ Role │ Active │ Created │ Act│  │
│  ├──────────┼───────┼──────┼────────┼─────────┼────│  │
│  │ admin    │ admin@│ admin│   Yes   │ 01/01   │ Del│  │
│  │          │ .com  │      │        │         │    │  │
│  ├──────────┼───────┼──────┼────────┼─────────┼────│  │
│  │ user1    │ user1@│ user │   Yes   │ 01/02   │ Del│  │
│  │          │ .com  │      │        │         │    │  │
│  ├──────────┼───────┼──────┼────────┼─────────┼────│  │
│  │ researcher│ res@  │ res  │   Yes   │ 01/03   │ Del│  │
│  │          │ .com  │      │        │         │    │  │
│  └──────────┴───────┴──────┴────────┴─────────┴────┘  │
│                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │ Total Users│ │Active Users│ │   Admins   │          │
│  │     10     │ │     8      │ │     2      │          │
│  │   [Users]  │ │  [Shield]  │ │  [Shield]  │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components
- **User Table**: Lists all users with details
- **Delete Button**: Remove users (except self)
- **Stats Cards**: Show total users, active users, admins

### Interactions
- Click "Delete" to remove user (with confirmation)
- View user statistics
- Filter users by role (future enhancement)
- Add new users (future enhancement)

---

## 8. Model Training Page

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] HDC System    [Home] [Draw] [Upload] [History] │
│                       [Analytics] [Training] [Admin]    │
│  admin (admin)                                          │
│                    [Logout]                             │
└─────────────────────────────────────────────────────────┘
│                                                         │
│  Model Training                                        │
│  Train and manage machine learning models               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [Brain] Train New Model                         │  │
│  │                                                 │  │
│  │ Model Name: [combined_model_v1]                │  │
│  │ Model Type: [Combined ▼]                        │  │
│  │ Epochs: [10]                                     │  │
│  │ Batch Size: [32]                                │  │
│  │ Learning Rate: [0.001]                          │  │
│  │                                                 │  │
│  │              [Start Training]                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [Brain] Trained Models                           │  │
│  │                                                 │  │
│  │ Combined Model v1          [Deployed]           │  │
│  │ Type: Combined  Version: 1.0.0                  │  │
│  │ Accuracy: 98.0%  F1: 97.0%                      │  │
│  │ [Deploy] [History]                              │  │
│  │                                                 │  │
│  │ Digits Model v1             [Inactive]           │  │
│  │ Type: Digits    Version: 1.0.0                  │  │
│  │ Accuracy: 99.0%  F1: 98.5%                      │  │
│  │ [Deploy] [History]                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components
- **Training Form**: Input fields for training parameters
- **Start Training Button**: Initiates model training
- **Models List**: Shows all trained models with metrics
- **Deploy Button**: Deploys selected model
- **History Button**: Shows training history

### Interactions
- Fill training form and click "Start Training"
- View training progress and metrics
- Deploy models by clicking "Deploy"
- View training history in modal
- Compare model performance
