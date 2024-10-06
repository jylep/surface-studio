import { initializeApp } from 'firebase/app';
import { getRemoteConfig } from 'firebase/remote-config';

const firebaseConfig = {
  apiKey: "AIzaSyAW1xTZr7BEYBfCIDfK4tFoqcohg3N5exo",
  authDomain: "surface-studio-879bc.firebaseapp.com",
  projectId: "surface-studio-879bc",
  storageBucket: "surface-studio-879bc.appspot.com",
  messagingSenderId: "369043611123",
  appId: "1:369043611123:web:f39cf55d5fe1e05fc38686"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const remoteConfig = getRemoteConfig(app);


remoteConfig.settings.minimumFetchIntervalMillis = 3600;

export { app, remoteConfig }

