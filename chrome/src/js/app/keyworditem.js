
import {EE} from './app';

export class KeywordItem extends React.Component{
    
    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(){
        EE.emit('keywordItemClick', this.props.item.id);
    }

    render() {
        return(
            <div 
                className={this.props.item.className} 
                onClick={this.handleClick}>
              
              {this.props.item.phrase}
              <span className="quantity">{this.props.item.quantity_nv_jobs}</span>
            
            </div> 
        )
    }
}

KeywordItem.propTypes = {
  item: React.PropTypes.object.isRequired
}

            