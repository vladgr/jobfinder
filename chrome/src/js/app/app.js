
import {Menu} from './menu';

let EventEmitter = require('events').EventEmitter;
export const EE = new EventEmitter();
export const CONFIG = {};

class App extends React.Component{

    constructor(props){
        super(props);
    
        this.state = {
            menuitems: []
        }
    }
  
    componentDidMount() {
        this.init();
    }

    init() {
        chrome.storage.local.get({token: '', apiSite: ''}, (obj) => {
            CONFIG.TOKEN = obj.token;
            let site = obj.apiSite;
            CONFIG.API_SITE = site;
            CONFIG.API_URL_MENU = `${site}/api/menu/`;
            CONFIG.API_URL_KEYWORDS = `${site}/api/keywords/`;
            CONFIG.API_URL_JOBS = `${site}/api/jobs/`;
            CONFIG.API_URL_JOB = `${site}/api/job/`;
            CONFIG.API_URL_JOB_DELETED = `${site}/api/job/mark/deleted/`;
            CONFIG.API_URL_JOB_VIEWED = `${site}/api/job/mark/viewed/`;
            CONFIG.API_URL_JOB_FEATURED = `${site}/api/job/mark/featured/`;
            this.loadMenu(); 
        });
    }

    loadMenu() {
        let params = new FormData()
        params.append('token', CONFIG.TOKEN);
        
        fetch(CONFIG.API_URL_MENU, {method: 'POST', body: params})
            .then(response => response.json())
            .then(data => this.setState({menuitems: data}));
    }
    
    render() {
        return (
            <div className="app">
                <Menu items={this.state.menuitems} />
            </div>
        );
    }
}

ReactDOM.render(
  <App />,
  document.getElementById('content')
);
