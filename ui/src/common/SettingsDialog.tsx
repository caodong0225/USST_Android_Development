import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import React, {Component} from 'react';
import {observable} from 'mobx';
import {observer} from 'mobx-react';
import {inject, Stores} from '../inject';

interface IProps {
    fClose: VoidFunction;
}

@observer
class SettingsDialog extends Component<IProps & Stores<'currentUser'>> {
    @observable
    private pass = '';

    public render() {
        const {pass} = this;
        const {fClose, currentUser} = this.props;
        const submitAndClose = () => {
            currentUser.changePassword(pass);
            fClose();
        };
        return (
            <Dialog
                open={true}
                onClose={fClose}
                aria-labelledby="form-dialog-title"
                id="changepw-dialog">
                <DialogTitle id="form-dialog-title">更改密码</DialogTitle>
                <DialogContent>
                    <TextField
                        className="newpass"
                        autoFocus
                        margin="dense"
                        type="password"
                        label="新密码 *"
                        value={pass}
                        onChange={(e) => (this.pass = e.target.value)}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={fClose}>取消</Button>
                    <Tooltip title={pass.length !== 0 ? '' : '密码是必需的'}>
                        <div>
                            <Button
                                className="change"
                                disabled={pass.length === 0}
                                onClick={submitAndClose}
                                color="primary"
                                variant="contained">
                                更改
                            </Button>
                        </div>
                    </Tooltip>
                </DialogActions>
            </Dialog>
        );
    }
}

export default inject('currentUser')(SettingsDialog);
