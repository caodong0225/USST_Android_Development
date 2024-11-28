import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import {NumberField} from '../common/NumberField';
import React, {Component} from 'react';

interface IProps {
    fClose: VoidFunction;
    fOnSubmit: (name: string, description: string, interval: number) => void;
    initialName: string;
    initialDescription: string;
    initialInterval: number;
}

interface IState {
    name: string;
    description: string;
    interval: number;
}

export default class UpdateDialog extends Component<IProps, IState> {
    public state = {name: '', description: '', interval: 5};

    constructor(props: IProps) {
        super(props);
        this.state = {
            name: props.initialName,
            description: props.initialDescription,
            interval: props.initialInterval,
        };
    }

    public render() {
        const {fClose, fOnSubmit} = this.props;
        const {name, description, interval} = this.state;
        const submitEnabled = this.state.name.length !== 0;
        const intervalEnabled = this.state.interval >= 5;
        const submitAndClose = () => {
            fOnSubmit(name, description, interval);
            fClose();
        };
        return (
            <Dialog
                open={true}
                onClose={fClose}
                aria-labelledby="form-dialog-title"
                id="app-dialog">
                <DialogTitle id="form-dialog-title">更新应用信息</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        应用可以用来消息推送
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        className="name"
                        label="应用名称 *"
                        type="text"
                        disabled={true}
                        value={name}
                        onChange={this.handleChange.bind(this, 'name')}
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        className="description"
                        label="参数"
                        value={description}
                        onChange={this.handleChange.bind(this, 'description')}
                        fullWidth
                        multiline
                    />
                    <NumberField
                        margin="dense"
                        className="interval"
                        label="刷新频率"
                        value={interval}
                        onChange={(value) => this.setState({interval: value})}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={fClose}>取消</Button>
                    <Tooltip title={submitEnabled ? intervalEnabled ? '' : '间隔必须大于等于5' : '应用名是必须的'}>
                        <div>
                            <Button
                                className="update"
                                disabled={!submitEnabled || !intervalEnabled}
                                onClick={submitAndClose}
                                color="primary"
                                variant="contained">
                                更新
                            </Button>
                        </div>
                    </Tooltip>
                </DialogActions>
            </Dialog>
        );
    }

    private handleChange(propertyName: string, event: React.ChangeEvent<HTMLInputElement>) {
        const state = this.state;
        state[propertyName] = event.target.value;
        this.setState(state);
    }
}
