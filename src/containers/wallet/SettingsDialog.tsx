import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { inject, observer } from 'mobx-react';
import { ChangeEvent } from 'react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import BlackBackdrop from '../../components/ModalBackdropBlack';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import Store from '../../stores/store';
import UserStore from '../../stores/user';

const styles = createStyles({
  content: {
    padding: '1em',
    textAlign: 'center'
  },
  input: {
    color: 'gray',
    width: '100%'
  },
  footer: {
    '& button': {
      color: 'gray'
    }
  }
});

interface Props extends WithStyles<typeof styles> {
  store?: Store;
  userStore?: UserStore;
  field: string;
  onClose: Function;
}

interface State {
  name: string | null;
  fiat: string;
}

const stylesDecorator = withStyles(styles);

@inject('store')
@inject('userStore')
@observer
class SettingsDialog extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const account = props.userStore!.selectedAccount!;
    this.state = {
      name: account.name,
      fiat: account.fiatCurrency
    };
  }

  handleBackClick = () => {
    this.props.onClose();
  };

  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    if (field === 'name') {
      this.setState({
        name: value
      });
    } else if (field === 'fiat') {
      this.setState({
        fiat: value
      });
    }
  };

  updateName = () => {
    this.props.userStore!.updateAccountName(this.state.name!);
    this.props.onClose();
  };

  updateFiat = (global: boolean) => () => {
    this.props.userStore!.updateFiat(this.state.fiat, global);
    this.props.onClose();
  };

  escListener = (event: KeyboardEvent) => {
    if (event.keyCode === 27) {
      this.props.onClose();
    }
  };

  componentDidMount() {
    document.addEventListener('keyup', this.escListener);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.escListener);
  }

  render() {
    const { userStore, store, classes } = this.props;

    return (
      <React.Fragment>
        <ModalPaper open={true} backdrop={BlackBackdrop}>
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
              <div className={this.props.classes.content}>
                <div>
                  Assign a new name to account {userStore!.selectedAccount!.id}.
                  This name will only be visible to you and nobody else.
                </div>
                <div>
                  <TextField
                    className={classes.input}
                    id="account-name"
                    label="Account name"
                    value={this.state.name || ''}
                    onChange={this.handleChange('name')}
                    margin="normal"
                  />
                </div>
                <div className={classes.footer}>
                  <Button onClick={this.updateName}>UPDATE NAME</Button>
                </div>
              </div>
            </React.Fragment>
          )}
          {this.props.field === 'delegate' && (
            <React.Fragment>
              <ModalPaperHeader
                backButton={true}
                onBackClick={this.handleBackClick}
              >
                <div>
                  <FormattedMessage
                    id="account-settings.title"
                    description="New account screen title"
                    defaultMessage="Voted delegate"
                  />
                </div>
              </ModalPaperHeader>
              <div className={classes.footer}>
                <Button onClick={this.updateName}>BUTTON</Button>
              </div>
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
              <div className={this.props.classes.content}>
                <div>
                  <select
                    name="fiat"
                    onChange={this.handleChange('fiat')}
                    className={classes.input}
                  >
                    {store!.config.fiat_currencies.map(name => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={classes.footer}>
                  <Button onClick={this.updateFiat(false)}>
                    SET FOR THIS ACCOUNT
                  </Button>
                  <Button onClick={this.updateFiat(true)}>
                    SET FOR ALL ACCOUNTS
                  </Button>
                </div>
              </div>
            </React.Fragment>
          )}
        </ModalPaper>
      </React.Fragment>
    );
  }
}

export default stylesDecorator(SettingsDialog);
