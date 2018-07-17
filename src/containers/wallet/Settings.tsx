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
      textTransform: 'none',
      height: '3.5em'
    },
    buttonContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      display: 'flex',
      width: '100%',
      '& > span:nth-child(2)': {
        color: 'gray'
      }
    },
    arrow: {
      verticalAlign: 'middle',
      marginLeft: '1em'
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

  handleFieldClick = (field: string) => {
    if (field === 'pinned') {
      runInAction(() => {
        const userStore = this.props.userStore!;
        const selectedAccount = userStore.selectedAccount!;
        selectedAccount.pinned = !selectedAccount.pinned;
        userStore.saveAccount(selectedAccount);
      });
    } else {
      this.setState({ dialogOpen: true, dialogField: field });
    }
  }

  render() {
    const { classes, userStore } = this.props;
    const account = userStore!.selectedAccount!;

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
            <div className={classes.buttonContent}>
              <span>Account name</span>
              <span>
                {account.name}
                <ArrowFwd className={classes.arrow} />
              </span>
            </div>
          </Button>
          <Button
            name="pinned"
            variant="contained"
            className={classes.button}
            onClick={() => this.handleFieldClick('pinned')}
          >
            <div className={classes.buttonContent}>
              <span>Pinned account</span>
              <span>
                {account.pinned ? 'Yes' : 'No'}
                <ArrowFwd className={classes.arrow} />
              </span>
            </div>
          </Button>
          <Button
            name="delegate"
            variant="contained"
            className={classes.button}
            onClick={() => this.handleFieldClick('delegate')}
          >
            <div className={classes.buttonContent}>
              <span>Voted delegate</span>
              <span>
                TODO
                <ArrowFwd className={classes.arrow} />
              </span>
            </div>
          </Button>
          <Button
            name="fiat"
            variant="contained"
            className={classes.button}
            onClick={() => this.handleFieldClick('fiat')}
          >
            <div className={classes.buttonContent}>
              <span>Displayed FIAT currency</span>
              <span>
                {account.fiatCurrency}
                <ArrowFwd className={classes.arrow} />
              </span>
            </div>
          </Button>
        </div>
      </React.Fragment>
    );
  }
}

export default stylesDecorator(AccountSettings);
