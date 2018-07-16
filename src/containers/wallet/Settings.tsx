import { runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import ArrowFwd from '@material-ui/icons/NavigateNext';
import Store from '../../stores/store';
import UserStore from '../../stores/user';
import Button from '@material-ui/core/Button';
import SettingsDialog from './SettingsDialog';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2
    },
    button: {
      width: '100%',
      textAlign: 'left',
      justifyContent: 'start',
      background: 'white',
      marginBottom: '1px',
      fontWeight: 'normal',
      textTransform: 'none'
    },
    right: {
      // TODO styles
      marginLeft: '10em'
    }
  });

interface Props extends WithStyles<typeof styles> {
  store?: Store;
  userStore?: UserStore;
}

interface State {
  dialogOpen: boolean;
  dialogField: string | null;
}

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

@inject('store')
@inject('userStore')
@observer
/**
 * TODO Translate
 */
class AccountSettings extends React.Component<Props, State> {
  state = {
    dialogOpen: false,
    dialogField: null
  };

  constructor(props: Props) {
    super(props);
  }

  handleFieldClick = field => {
    if (field === 'pinned') {
      runInAction(() => {
        let userStore = this.props.userStore!;
        userStore.selectedAccount.pinned = !this.props.userStore!
          .selectedAccount.pinned;
        userStore.saveAccount(userStore.selectedAccount);
      });
    } else {
      this.setState({ dialogOpen: true, dialogField: field });
    }
  }

  render() {
    const { classes, userStore } = this.props;
    const account = userStore.selectedAccount;

    if (!account) {
      // TODO loading indicator
      return <div>Loading</div>;
    }

    return (
      <React.Fragment>
        {this.state.dialogOpen && (
          <SettingsDialog
            field={this.state.dialogField!}
            onClose={() => this.setState({ dialogOpen: false })}
          />
        )}
        <div className={classes.content}>
          <Button
            name="name"
            variant="contained"
            className={classes.button}
            onClick={() => this.handleFieldClick('name')}
          >
            Account name
            <span className={classes.right}>
              {userStore.selectedAccount.name}
              <ArrowFwd />
            </span>
          </Button>
          <Button
            name="pinned"
            variant="contained"
            className={classes.button}
            onClick={() => this.handleFieldClick('pinned')}
          >
            Pinned account
            <span className={classes.right}>
              {userStore.selectedAccount.pinned ? 'Yes' : 'No'}
              <ArrowFwd />
            </span>
          </Button>
          <Button
            name="delegate"
            variant="contained"
            className={classes.button}
            onClick={() => this.handleFieldClick('delegate')}
          >
            Voted delegate
            <span className={classes.right}>
              TODO <ArrowFwd />
            </span>
          </Button>
          <Button
            name="fiat"
            variant="contained"
            className={classes.button}
            onClick={() => this.handleFieldClick('fiat')}
          >
            Displayed FIAT currency
            <span className={classes.right}>
              {userStore.selectedAccount.fiatCurrency}
              <ArrowFwd />
            </span>
          </Button>
        </div>
      </React.Fragment>
    );
  }
}

export default stylesDecorator(AccountSettings);
