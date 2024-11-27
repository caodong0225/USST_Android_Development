import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Delete from '@material-ui/icons/Delete';
import Edit from '@material-ui/icons/Edit';
import CloudUpload from '@material-ui/icons/CloudUpload';
import React, {ChangeEvent, Component, SFC} from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import DefaultPage from '../common/DefaultPage';
import Button from '@material-ui/core/Button';
import CopyableSecret from '../common/CopyableSecret';
import AddApplicationDialog from './AddApplicationDialog';
import {observer} from 'mobx-react';
import {observable} from 'mobx';
import {inject, Stores} from '../inject';
import * as config from '../config';
import UpdateDialog from './UpdateApplicationDialog';
import {IApplication} from '../types';
import {LastUsedCell} from '../common/LastUsedCell';
import AutoSwitch from "../common/AutoSwitch";

@observer
class Applications extends Component<Stores<'appStore'>> {
    @observable
    private deleteId: number | false = false;
    @observable
    private updateId: number | false = false;
    @observable
    private createDialog = false;

    private uploadId = -1;
    private upload: HTMLInputElement | null = null;

    public componentDidMount = () => this.props.appStore.refresh();

    public render() {
        const {
            createDialog,
            deleteId,
            updateId,
            props: {appStore},
        } = this;
        const apps = appStore.getItems();
        return (
            <DefaultPage
                title="应用列表"
                rightControl={
                    <Button
                        id="create-app"
                        variant="contained"
                        color="primary"
                        onClick={() => (this.createDialog = true)}>
                        创建应用
                    </Button>
                }
                maxWidth={1000}>
                <Grid item xs={12}>
                    <Paper elevation={6}>
                        <Table id="app-table">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" style={{width: 80}} />
                                    <TableCell>应用名</TableCell>
                                    <TableCell>Token</TableCell>
                                    <TableCell>参数</TableCell>
                                    <TableCell>优先级</TableCell>
                                    <TableCell>最近使用</TableCell>
                                    <TableCell>是否启用</TableCell>
                                    <TableCell>刷新频率（秒）</TableCell>
                                    <TableCell />
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {apps.map((app: IApplication) => (
                                    <Row
                                        key={app.id}
                                        description={
                                            app.isEnabled ?
                                                app.description.length > 6 ? app.description.substring(0, 6) + '......' + app.description.substring(app.description.length - 6) : app.description
                                                :
                                                "参数失效！"
                                        }
                                        defaultPriority={app.defaultPriority}
                                        image={app.isEnabled ? app.image : 'static/unknown.png'}
                                        name={app.isEnabled ? app.name : "出错了！"}
                                        value={app.token}
                                        lastUsed={app.lastUsed}
                                        fUpload={() => this.uploadImage(app.id)}
                                        fDelete={() => (this.deleteId = app.id)}
                                        fEdit={() => (this.updateId = app.id)}
                                        noDelete={app.internal}
                                        fSetAuto={
                                            (newValue) => (this.props.appStore.setAuto(app.id,newValue))
                                        }
                                        interval={app.intervalTime}
                                        enabled = {app.isRunning}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                        <input
                            ref={(upload) => (this.upload = upload)}
                            type="file"
                            style={{display: 'none'}}
                            onChange={this.onUploadImage}
                        />
                    </Paper>
                </Grid>
                {createDialog && (
                    <AddApplicationDialog
                        fClose={() => (this.createDialog = false)}
                        fOnSubmit={appStore.create}
                    />
                )}
                {updateId !== false && (
                    <UpdateDialog
                        fClose={() => (this.updateId = false)}
                        fOnSubmit={(name, description, defaultPriority) =>
                            appStore.update(updateId, name, description, defaultPriority)
                        }
                        initialDescription={appStore.getByID(updateId).description}
                        initialName={appStore.getByID(updateId).name}
                        initialDefaultPriority={appStore.getByID(updateId).defaultPriority}
                    />
                )}
                {deleteId !== false && (
                    <ConfirmDialog
                        title="确定删除吗"
                        text={'删除 ' + appStore.getByID(deleteId).name + '?'}
                        fClose={() => (this.deleteId = false)}
                        fOnSubmit={() => appStore.remove(deleteId)}
                    />
                )}
            </DefaultPage>
        );
    }

    private uploadImage = (id: number) => {
        this.uploadId = id;
        if (this.upload) {
            this.upload.click();
        }
    };

    private onUploadImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        if (['image/png', 'image/jpeg', 'image/gif'].indexOf(file.type) !== -1) {
            this.props.appStore.uploadImage(this.uploadId, file);
        } else {
            alert('Uploaded file must be of type png, jpeg or gif.');
        }
    };
}

interface IRowProps {
    name: string;
    value: string;
    noDelete: boolean;
    description: string;
    defaultPriority: number;
    lastUsed: string | null;
    fUpload: VoidFunction;
    image: string;
    fDelete: VoidFunction;
    fEdit: VoidFunction;
    fSetAuto: (newValue: boolean) => void;
    interval: number;
    enabled: boolean;
}


const Row: SFC<IRowProps> = observer(
    ({
        name,
        value,
        noDelete,
        description,
        defaultPriority,
        lastUsed,
        fDelete,
        fUpload,
        image,
        fEdit,
         fSetAuto,
        interval,
        enabled,
    }) => (
        <TableRow>
            <TableCell padding="default">
                <div style={{display: 'flex'}}>
                    <img src={config.get('url') + image} alt="app logo" width="40" height="40" />
                    <IconButton onClick={fUpload} style={{height: 40}}>
                        <CloudUpload />
                    </IconButton>
                </div>
            </TableCell>
            <TableCell>{name}</TableCell>
            <TableCell>
                <CopyableSecret value={value} style={{display: 'flex', alignItems: 'center'}} />
            </TableCell>
            <TableCell>{description}</TableCell>
            <TableCell>{defaultPriority}</TableCell>
            <TableCell>
                <LastUsedCell lastUsed={lastUsed} />
            </TableCell>
            <TableCell>
                <AutoSwitch
                    isRunning={enabled}
                    onToggle={fSetAuto}
                />
            </TableCell>
            <TableCell>{interval}</TableCell>
            <TableCell align="right" padding="none">
                <IconButton onClick={fEdit} className="edit">
                    <Edit />
                </IconButton>
            </TableCell>
            <TableCell align="right" padding="none">
                <IconButton onClick={fDelete} className="delete" disabled={noDelete}>
                    <Delete />
                </IconButton>
            </TableCell>
        </TableRow>
    )
);

export default inject('appStore')(Applications);
