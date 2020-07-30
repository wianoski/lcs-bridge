import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { red, orange, green, blue, purple } from '@material-ui/core/colors';

const useStyles = makeStyles((theme) => ({
    speedDial: {
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
    sensorError: {
        backgroundColor: purple[500],
    },
    maintenance: {
        backgroundColor: blue[500],
    },
    danger: {
        backgroundColor: red[500],
    },
    warning: {
        backgroundColor: orange[500],
    },
    healthy: {
        backgroundColor: green[500],
    },
}));


export default function SpeedDialTooltipOpen(props) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    var actionss
    if (props.privilege > 2) {
        actionss = [
            { icon: <FiberManualRecordIcon style={{ color: blue[500] }} />, color: blue[500], name: 'Maintenance' },
            { icon: <FiberManualRecordIcon style={{ color: red[500] }} />, color: red[500], name: 'Danger' },
            { icon: <FiberManualRecordIcon style={{ color: orange[500] }} />, color: orange[500], name: 'Warning' },
            { icon: <FiberManualRecordIcon style={{ color: green[500] }} />, color: green[500], name: 'Healthy' }
        ];
    } else {
        actionss = [
            { icon: <FiberManualRecordIcon style={{ color: purple[500] }} />, color: purple[500], name: 'Sensor Trouble' },
            { icon: <FiberManualRecordIcon style={{ color: blue[500] }} />, color: blue[500], name: 'Maintenance' },
            { icon: <FiberManualRecordIcon style={{ color: red[500] }} />, color: red[500], name: 'Danger' },
            { icon: <FiberManualRecordIcon style={{ color: orange[500] }} />, color: orange[500], name: 'Warning' },
            { icon: <FiberManualRecordIcon style={{ color: green[500] }} />, color: green[500], name: 'Healthy' },
            { icon: <FiberManualRecordIcon style={{ color: 'black' }} />, color: 'black', name: 'Unusable' },
        ];
    }

    const handleOpen = () => {
        if (open) {
            setOpen(false);
        } else {
            setOpen(true);
        }
    };

    return (
        <div>
            <SpeedDial
                ariaLabel="SpeedDial tooltip example"
                className={classes.speedDial}
                icon={<HelpOutlineIcon />}
                FabProps={{
                    onClick: handleOpen
                }}
                open={open}
            >
                {actionss.map((action) => (
                    <SpeedDialAction
                        key={action.name}
                        tooltipTitle={action.name}
                        tooltipOpen
                        icon={action.icon}
                        FabProps={{
                            style: {
                                backgroundColor: action.color
                            }
                        }}
                    />
                ))}
            </SpeedDial>
        </div>
    );
}
