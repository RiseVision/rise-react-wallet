import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ModalBackdrop from '../../components/ModalBackdrop';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import Store from '../../stores/store';
import UserStore from '../../stores/user';

interface Props {
  store?: Store;
  userStore?: UserStore;
  field: string;
  onClose: Function;
}

interface State {
  name: string;
  fiat: string;
}

@inject('store')
@inject('userStore')
@observer
class SettingsDialog extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const account = props.userStore!.selectedAccount;
    this.state = {
      name: account.name,
      fiat: account.fiatCurrency
    };
  }

  handleBackClick = () => {
    this.props.onClose();
  }

  handleChange = field => event => {
    if (field === 'name') {
      this.setState({
        name: event.target.value
      });
    }
  }

  updateName = () => {
    this.props.userStore!.updateAccountName(this.state.name);
    this.props.onClose();
  }

  render() {
    const { userStore } = this.props;

    return (
      <React.Fragment>
        {/* TODO black and semi-transparent backdrop */}
        <ModalBackdrop open={true} transitionDuration={0} />
        <ModalPaper open={true}>
          {this.props.field === 'name' && (
            <React.Fragment>
              <ModalPaperHeader
                backButton={true}
                onBackClick={this.handleBackClick}
              >
                <FormattedMessage
                  id="account-settings.title"
                  description="New account screen title"
                  defaultMessage="Update account name"
                />
              </ModalPaperHeader>
              <p>
                Assign a new name to account {userStore.selectedAccount.id}.
                This name will only be visible to you and nobody else.
              </p>
              <div>
                <TextField
                  id="account-name"
                  label="Account name"
                  value={this.state.name}
                  onChange={this.handleChange('name')}
                  margin="normal"
                />
              </div>
              <div>
                <Button onClick={this.updateName}>UPDATE NAME</Button>
              </div>
            </React.Fragment>
          )}
          {this.props.field === 'delegate' && (
            <React.Fragment>
              <ModalPaperHeader
                backButton={true}
                onBackClick={this.handleBackClick}
              >
                <FormattedMessage
                  id="account-settings.title"
                  description="New account screen title"
                  defaultMessage="Voted delegate"
                />
              </ModalPaperHeader>
              Content
            </React.Fragment>
          )}
          {this.props.field === 'fiat' && (
            <React.Fragment>
              <ModalPaperHeader
                backButton={true}
                onBackClick={this.handleBackClick}
              >
                <FormattedMessage
                  id="account-settings.title"
                  description="New account screen title"
                  defaultMessage="Displayed FIAT currency"
                />
              </ModalPaperHeader>
              Content
            </React.Fragment>
          )}
        </ModalPaper>
      </React.Fragment>
    );
  }
}

export default SettingsDialog;
