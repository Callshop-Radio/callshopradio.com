import React from 'react';
interface Config {
    clientId: string;
    clientSecret: string;
    userId: string;
}
interface InputProps {
    config: Config;
    onChange: (value: any) => void;
    value: any;
}
export declare const SoundCloudInputField: React.FC<InputProps>;
export default SoundCloudInputField;
