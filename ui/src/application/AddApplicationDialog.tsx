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
    fOnSubmit: (name: string, description: string, defaultInterval: number) => void;
}

interface IState {
    name: string;
    description: string;
    defaultInterval: number;
}

export default class AddDialog extends Component<IProps, IState> {
    public state = {name: '', description: '', defaultInterval: 5};

    public render() {
        const {fClose, fOnSubmit} = this.props;
        const {name, description, defaultInterval} = this.state;
        const submitEnabled = this.state.name.length !== 0
        const intervalEnabled = this.state.defaultInterval >= 5
        const submitAndClose = () => {
            fOnSubmit(name, description, defaultInterval);
            fClose();
        };
        return (
            <Dialog
                open={true}
                onClose={fClose}
                aria-labelledby="form-dialog-title"
                id="app-dialog">
                <DialogTitle id="form-dialog-title">创建一个应用</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        应用可以用来发送消息
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        className="name"
                        label="名称 *"
                        type="text"
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
                        value={defaultInterval}
                        onChange={(value) => this.setState({defaultInterval: value})}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={fClose}>取消</Button>
                    <Tooltip title={submitEnabled ? intervalEnabled ? '' : '间隔必须大于等于5' : '名称是必须的'}>
                        <div>
                            <Button
                                className="create"
                                disabled={!submitEnabled || !intervalEnabled}
                                onClick={submitAndClose}
                                color="primary"
                                variant="contained">
                                创建
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
