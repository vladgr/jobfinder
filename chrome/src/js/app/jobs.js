
import {JobIndeedItem, JobUpworkItem} from './jobitem';

export class Jobs extends React.Component{
    constructor(props){
        super(props);
    }
    
    render() {
        let jobItems = [];
        for (let [, item] of this.props.jobs){
            item.className = item.id === this.props.active ? 'item active' : 'item';
            item.country = this.props.countries.get(item.country_id);
            let dt = new Date(Date.parse(item.dt));
            item.dt = dt.toDateString();

            switch (this.props.jobModel){
            case 'JobIndeed':
                jobItems.push(<JobIndeedItem item={item} key={item.id} />);
                break;
            case 'JobUpwork':
                jobItems.push(<JobUpworkItem item={item} key={item.id} />);
                break;
            }
        }

        let tHeader = null;
        if (this.props.jobModel && this.props.jobModel === 'JobUpwork'){
            tHeader = (<tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td title='Total Spent'>{'Spent, $'}</td>
                        <td title='Budget'>{'Budget, $'}</td>
                        <td title='Average Hour Price'>{'AHP, $'}</td>
                        <td title='Hours'>{'HH'}</td>
                        <td title='Jobs Posted'>{'JoPo'}</td>
                        <td title='Hire Rate'>{'HiRa, %'}</td>
                        <td title='Active Hires'>{'AcHi, $'}</td>
                        <td title='Stars'>{'Stars'}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>);
        }

        return (
            <div>
                <div className="jobs">
                    <table>
                        <tbody>
                        {tHeader}
                        {jobItems}
                        </tbody>
                    </table>
                </div>
            </div>    
        );
    }
}


Jobs.propTypes = {
  active: React.PropTypes.number.isRequired,
  countries: React.PropTypes.instanceOf(Map).isRequired,
  jobModel: React.PropTypes.string.isRequired,
  jobs: React.PropTypes.instanceOf(Map).isRequired
}
