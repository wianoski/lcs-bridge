import React from 'react';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Button, Snackbar, Grid } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import Logo from '../../Asset/logo.jpeg'
import { auth } from '../../index'

export default function Login(props) {
    const [open] = React.useState(true);
    const [email, setEmail] = React.useState();
    const [password, setPassword] = React.useState();
    const [openNotification, setOpenNotification] = React.useState(false);
    const [notificationMessage, setNotificationMessage] = React.useState({});

    const handleEmail = (event) => {
        setEmail(event.target.value);
    };
    const handlePassword = (event) => {
        setPassword(event.target.value);
    };
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenNotification(false);
    };
    const login = () => {
        auth.signInWithEmailAndPassword(email, password).catch(function (error) {
            setNotificationMessage(error.message)
            setOpenNotification(true)
        });
    };
    return (
        <div>
            <Snackbar open={openNotification} autoHideDuration={6000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleClose} severity="error">
                    {notificationMessage}
                </Alert>
            </Snackbar>
            <Dialog open={open} aria-labelledby="form-dialog-title">
                <div style={{ padding: 20 }}>
                    <iframe name="loginTarget" title="loginBuffer" style={{ display: 'none' }}></iframe>
                    <form onSubmitCapture={login} target="loginTarget">
                        <Grid item xs={12} md={12}>
                            <Grid
                                container
                                spacing={0}
                                align="center"
                                justify="center"
                                direction="column"
                            >
                                <Grid item>
                                    <img alt='Logo' src={Logo} style={{ width: '70%' }} />
                                </Grid>
                            </Grid>
                        </Grid>
                        <DialogTitle style={{ textAlign: 'center', }} id="form-dialog-title">Login</DialogTitle>
                        <Divider variant="middle" />
                        <DialogContent>
                            <TextField
                                required
                                autoFocus
                                label="Email Address"
                                type="email"
                                margin="dense"
                                color="primary"
                                variant="outlined"
                                id="email"
                                fullWidth
                                autoComplete="off"
                                onChange={handleEmail}
                            />
                            <br />
                            <TextField
                                required
                                fullWidth
                                autoComplete="off"
                                label="Password"
                                type="password"
                                margin="dense"
                                color="primary"
                                variant="outlined"
                                id="password"
                                onChange={handlePassword}
                            />
                        </DialogContent>
                        <Divider variant="middle" />
                        <br />
                        <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>Login</Button>
                    </form>
                </div>
            </Dialog>
        </div>
    );
}
