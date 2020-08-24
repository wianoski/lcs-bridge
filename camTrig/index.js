const onvif = require('node-onvif');
 
// Create an OnvifDevice object
let device = new onvif.OnvifDevice({
  xaddr: 'http://192.168.0.114:8080/onvif/device_service',
  user : 'admin',
  pass : 'admin123'
});
 
// Initialize the OnvifDevice object
device.init().then(() => {
  // Get the UDP stream URL
  let url = device.getUdpStreamUrl();
  console.log(url);
}).catch((error) => {
  console.error(error);
});