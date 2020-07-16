import React, { useContext } from 'react';
import clsx from 'clsx';
import * as Material from '@material-ui/core'
import MenuIcon from '@material-ui/icons/Menu';
import Context from '../../Backend/Context';
import DashboardIcon from '@material-ui/icons/Dashboard';

const useStyles = Material.makeStyles((theme) => ({
    list: {
        width: 250,
    },
    fullList: {
        width: 'auto',
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
}));

export default function Sidebar(props) {
    const { state, actions } = useContext(Context)
    const classes = useStyles();
    const [states, setStates] = React.useState({
        top: false,
        left: false,
        bottom: false,
        right: false,
    });
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const handleListItemClick = (event, index) => {
        setSelectedIndex(index);
        if (index === 0) {
            actions({
                type: 'setState',
                payload: {
                    ...state,
                    currentPage: 'root'
                }
            })
        }
    };

    const toggleDrawer = (anchor, open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setStates({ ...states, [anchor]: open });
    };

    const list = (anchor) => (
        <div
            className={clsx(classes.list, {
                [classes.fullList]: anchor === 'top' || anchor === 'bottom',
            })}
            role="presentation"
        >
            <Material.List>
                <Material.ListItem
                    button
                    key={'Beranda'}
                    selected={selectedIndex === 0}
                    onClick={(event) => handleListItemClick(event, 0)}
                >
                    <Material.ListItemIcon><DashboardIcon /></Material.ListItemIcon>
                    <Material.ListItemText primary={'Beranda'} />
                </Material.ListItem>
            </Material.List>
        </div>
    );
    const anchor = 'left'
    return (
        <div>
            <React.Fragment key={anchor}>
                <Material.IconButton
                    edge="start"
                    className={classes.menuButton}
                    color="inherit"
                    aria-label="open drawer"
                    onClick={toggleDrawer(anchor, true)}
                >
                    <MenuIcon />
                </Material.IconButton>
                <Material.Drawer anchor={anchor} open={states[anchor]} onClose={toggleDrawer(anchor, false)}>
                    {list(anchor)}
                </Material.Drawer>
            </React.Fragment>
        </div>
    );
}
