
import {MenuItem} from './menuitem';
import {Keywords} from './keywords';
import {Jobs} from './jobs';
import {CONFIG, EE} from './app';

export class Menu extends React.Component{
  
    constructor(props){
        super(props);
        this.chooseMenu = this.chooseMenu.bind(this);
        this.state = {
            active: 0,
            activeKeyword: 0,
            activeJob: 0,
            keywords: [],
            countries: new Map(),
            jobModel: '',
            jobs: new Map(),
            jobDescription: ''
        };
    }

    componentDidMount(){
        EE.addListener('keywordItemClick', id => this.chooseKeyword(id));

        EE.addListener('descriptionClick', (item, yCoord) => {
            let params = new FormData();
            params.append('keyword_id', item.keyword_id);
            params.append('job_id', item.id);
            params.append('token', CONFIG.TOKEN);
            
            this.showDescription(item, yCoord);

            fetch(CONFIG.API_URL_JOB_VIEWED, {method: 'POST', body: params})
                .then(response => response.json())
                .then(data => {
                    this.markViewed(item.id);
                    
                    // reload Keywords to update quantity_nv_jobs
                    this.loadKeywords(this.state.active);
                });
        });

        EE.addListener('deleteClick', item => {
            let params = new FormData();
            params.append('keyword_id', item.keyword_id);
            params.append('job_id', item.id);
            params.append('token', CONFIG.TOKEN);

            fetch(CONFIG.API_URL_JOB_DELETED, {method: 'POST', body: params})
                .then(response => response.json())
                .then(data => this.markDeleted(item.id));
        });
        
        EE.addListener('featuredClick', item => {
            let params = new FormData();
            params.append('keyword_id', item.keyword_id);
            params.append('job_id', item.id);
            params.append('token', CONFIG.TOKEN);
            
            fetch(CONFIG.API_URL_JOB_FEATURED, {method: 'POST', body: params})
                .then(response => response.json())
                .then(data => this.markFeatured(item.id));
        });

        document.addEventListener('keydown', this.handleEscKey.bind(this));
    }
    
    componentWillUnmount() {
        EE.removeAllListeners('keywordItemClick');
        EE.removeAllListeners('descriptionClick');
        EE.removeAllListeners('deleteClick');
        EE.removeAllListeners('featuredClick');

        document.removeEventListener('keydown', this.handleEscKey.bind(this));
    }

    chooseMenu(siteId) {
        this.setState({active: siteId, jobs: new Map()});
        this.loadKeywords(siteId);
    }

    handleEscKey(event) {
        if (event.keyCode === 27){
            this.setState({jobDescription: ''});    
        }
    }

    showDescription(item, yCoord){
        this.setState({jobDescription: item.description}, () => {
            var div = this.refs.jobDescriptionDiv;
            yCoord += 100;
            div.style.top = `${yCoord}px`;
        });
    }

    loadKeywords(siteId) {
        let params = new FormData()
        params.append('site_id', siteId);
        params.append('token', CONFIG.TOKEN);
        fetch(CONFIG.API_URL_KEYWORDS, {method: 'POST', body: params})
            .then(response => response.json())
            .then(data => this.setState({keywords: data}));
    }

    chooseKeyword(keywordId) {
        this.setState({activeKeyword: keywordId});
        this.loadJobs(keywordId);
    }

    loadJobs(keywordId) {
        let params = new FormData()
        params.append('keyword_id', keywordId)
        params.append('token', CONFIG.TOKEN);
        fetch(CONFIG.API_URL_JOBS, {method: 'POST', body: params})
            .then(response => response.json())
            .then(data => this.setState({
                jobs: new Map(data.items),
                jobModel: data.job_model,
                countries: new Map(data.countries)
            }));
    }

    markViewed(job_id) {
        let jobs = this.state.jobs;
        jobs.get(job_id).is_viewed=true;
        this.setState({jobs: jobs});
    }

    markDeleted(job_id) {
        let jobs = this.state.jobs;
        jobs.delete(job_id);
        this.setState({jobs: jobs});
    }

    markFeatured(job_id) {
        let jobs = this.state.jobs;
        let job = jobs.get(job_id);
        job.is_featured = !job.is_featured;
        this.setState({jobs: jobs});
    }


    
    render() {
        let menuItems = this.props.items.map( (item) => {
            item.className = item.id === this.state.active ? 'item active' : 'item';
            return <MenuItem chooseMenu={this.chooseMenu} item={item} key={item.id} />
        });

        return (
            <div>
                {this.state.jobDescription.length > 0 ?
                    <div className="job_description" 
                        dangerouslySetInnerHTML={{__html: this.state.jobDescription}} 
                        ref="jobDescriptionDiv" /> : null}
                
                <div className="menu">
                    {menuItems}
                </div>

                {this.state.keywords.length > 0 ? 
                     <Keywords
                         active={this.state.activeKeyword}
                         keywords={this.state.keywords} /> : null}
  
                {this.state.jobs.size > 0 ? 
                    <Jobs 
                        active={this.state.activeJob}
                        countries={this.state.countries}
                        jobModel={this.state.jobModel} 
                        jobs={this.state.jobs} /> : null}
            </div>  
        );
    }
}


Menu.propTypes = {
  items: React.PropTypes.array.isRequired
}

