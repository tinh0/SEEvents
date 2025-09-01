import axios from 'axios'

export default axios.create({
  // change to your local ip address for testing
  // will be deployment url later
  baseURL: 'https://seevents-nodejs.onrender.com'
  //baseURL:'http://localhost:8000'
});