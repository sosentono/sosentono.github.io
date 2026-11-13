import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './components/arc/foundation.css';
import './arc-theme.css';
import { triggerRecaptchaOnBoot } from './utils/recaptcha';

triggerRecaptchaOnBoot();

createRoot(document.getElementById('root')!).render(<App />);
