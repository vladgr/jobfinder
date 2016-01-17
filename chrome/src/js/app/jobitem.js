
import {EE} from './app';

class JobItem extends React.Component{
    
    constructor(props){
        super(props);
        this.handleDescriptionClick = this.handleDescriptionClick.bind(this);
        this.handleDeleteClick = this.handleDeleteClick.bind(this);
        this.handleFeaturedClick = this.handleFeaturedClick.bind(this);

    }

    handleDescriptionClick(e){
        let yCoord = e.target.offsetTop;
        EE.emit('descriptionClick', this.props.item, yCoord);
    }

    handleDeleteClick(){
        EE.emit('deleteClick', this.props.item);
    }

    handleFeaturedClick(){
        EE.emit('featuredClick', this.props.item);
    }

    getMixins(item){
        let mixins = [];
        mixins.push(
            <td className="ico" key="2">
                <i className="fa fa-star featured" onClick={this.handleFeaturedClick}></i>
            </td>
        );

        mixins.push(
            <td className="ico" key="3">
                <a href={item.url} target="_blank">
                    <i className="fa fa-external-link url"></i>
                </a>
            </td>
        );
        
        mixins.push(
            <td className="ico" key="4">
                <i className="fa fa-trash-o del" onClick={this.handleDeleteClick}></i>
            </td>);
        return mixins;
    }

    getClassName(item) {
        let className = 'item';
        className += item.is_viewed ? '' : ' notviewed';
        className += item.is_featured ? ' featured' : '';
        return className;
    }

    getTdJobTitle(){
        return <td className='jobtitle' onClick={this.handleDescriptionClick}>{this.props.item.jobtitle}</td>
    }

}


export class JobIndeedItem extends JobItem{
    constructor(props){
        super(props);
    }

    render() {
        let mixins = this.getMixins(this.props.item);
        let className = this.getClassName(this.props.item);
        let tdJobTitle = this.getTdJobTitle()
        
        return(
            <tr className={className}>
                
                <td>{this.props.item.id}</td>
                <td>{this.props.item.dt}</td>
                <td>{this.props.item.country}</td>
                <td>{this.props.item.city}</td>
                {tdJobTitle}
                {mixins}

            </tr> 
        )
    }
}


export class JobUpworkItem extends JobItem{
    constructor(props){
        super(props);
    }

    render() {
        let mixins = this.getMixins(this.props.item);
        let className = this.getClassName(this.props.item);
        let tdJobTitle = this.getTdJobTitle()

        return(
            <tr className={className}>
                
                <td>{this.props.item.id}</td>
                <td>{this.props.item.dt}</td>
                <td>{this.props.item.country}</td>
                {tdJobTitle}
                <td>{this.props.item.total_spent}</td>
                <td>{this.props.item.budget}</td>
                <td>{this.props.item.avg_hour_price}</td>
                <td>{this.props.item.hours}</td>

                <td>{this.props.item.jobs_posted}</td>
                <td>{this.props.item.hire_rate}</td>
                <td>{this.props.item.active_hires}</td>
                <td>{this.props.item.stars}</td>
                
                {mixins}

            </tr> 
        )
    }
}


JobItem.propTypes = {
  item: React.PropTypes.object.isRequired
}

            