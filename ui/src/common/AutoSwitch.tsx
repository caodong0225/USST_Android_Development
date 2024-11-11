import React, { Component } from 'react';
import Switch from '@material-ui/core/Switch';
import { inject, Stores } from '../inject';

interface IProps {
    isAuto: boolean;
    onToggle: (newValue: boolean) => void;
    style?: React.CSSProperties;
}

interface IState {
    checked: boolean;
}

class AutoSwitch extends Component<IProps & Stores<'snackManager'>, IState> {
    public state = {
        checked: this.props.isAuto,
    };

    public render() {
        const { style } = this.props;
        const { checked } = this.state;

        return (
            <div style={style}>
                {/*<Typography style={{ fontSize: 16, marginRight: 8 }}>自动签到</Typography>*/}
                <Switch
                    checked={checked}
                    onChange={this.handleToggle}
                    color="primary"
                    inputProps={{ 'aria-label': 'auto switch' }}
                />
            </div>
        );
    }

    private handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = event.target.checked;
        this.setState({ checked: newChecked });
        this.props.onToggle(newChecked);
    };
}

export default inject('snackManager')(AutoSwitch);
