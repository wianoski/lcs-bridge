import React from 'react';
import Navbar from '../Components/Navbar'
import Dashboard from './Dashboard'
import { Grid } from '@material-ui/core'
import Preloader from '../Components/Preloader'

function App(props) {
  return (
    <>
      {props.user ? (
        <>
          <Navbar title={'JembatanKu'} user={props.user} />
          <Grid container spacing={3} style={{ margin: 0, width: '100%', height: '100%', flexGrow: 1 }}>
            <Dashboard privilege={props.privilege} user={props.user} />
          </Grid>
        </>
      ) : <Preloader />}
    </>
  );
}

export default App;
