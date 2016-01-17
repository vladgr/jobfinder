
export class MenuItem extends React.Component{
    
    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(){
        this.props.chooseMenu(this.props.item.id);
    }

    render() {
        return(
            <div 
                className={this.props.item.className} 
                onClick={this.handleClick}>
              {this.props.item.name}
            </div>  
          )
   }
}

MenuItem.propTypes = {
  chooseMenu: React.PropTypes.func.isRequired,
  item: React.PropTypes.object.isRequired
}