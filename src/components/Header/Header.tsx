import {TonConnectButton} from "@tonconnect/ui-react";
import './header.scss';

export const Header = () => {
    return <header>
        <span>Fintopio Sender</span>
        <TonConnectButton />
    </header>
}
