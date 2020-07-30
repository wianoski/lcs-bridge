import React from 'react';
import Chip from '@material-ui/core/Chip';

export default function Chips(props) {
    return (
        <Chip
            style={{width: '100%'}}
            icon={props.icon}
            label={props.value}
        />
    );
}
