import './patch-local-storage-for-github-pages';

import {StrictMode} from 'react'
import { render } from 'react-dom';
import App from './App'
import eruda from "eruda";

eruda.init();

render(
    <StrictMode>
        <App />
    </StrictMode>,
    document.getElementById('root') as HTMLElement
)
