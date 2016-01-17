

import {KeywordItem} from './keyworditem';

export class Keywords extends React.Component{
    constructor(props){
        super(props);
    }
    
    render() {
        let keywordItems = this.props.keywords.map( (item) => {
            item.className = item.id === this.props.active ? 'item active' : 'item';
            return <KeywordItem item={item} key={item.id} ref="ki" />;
        });

        return (
            <div className="keywords">
                {keywordItems}
            </div>
        );
    }
}

Keywords.propTypes = {
  active: React.PropTypes.number.isRequired,
  keywords: React.PropTypes.array.isRequired
}

