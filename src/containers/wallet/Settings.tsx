import { runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import * as classNames from 'classnames';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import ArrowFwd from '@material-ui/icons/NavigateNext';
import Store from '../../stores/store';
import UserStore from '../../stores/user';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import SettingsDialog from './SettingsDialog';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      '& > button': {
        borderRadius: 0
      }
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
    subsectionTitle: {
      marginTop: theme.spacing.unit * 2,
      marginBottom: theme.spacing.unit,
      ['&:first-child']: {
        marginTop: 0
      }
    },
    remove: {
      color: 'red'
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
      marginLeft: theme.spacing.unit * 2,
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
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('name')}
            label="Account name"
            value={account.name || ''}
          />
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('pinned')}
            label="Pinned account"
            value={account.pinned ? 'Yes' : 'No'}
          />
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('delegate')}
            label="Voted delegate"
            value="TODO"
          />
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('fiat')}
            label="Displayed FIAT currency"
            value={account.fiatCurrency}
          />
          <Typography
            className={classes.subsectionTitle}
            variant="body2"
            color="textSecondary"
          >
            Advanced settings
          </Typography>
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('mnemonic2')}
            label="2nd passphrase"
            value={account.mnemonic2 ? 'Set' : 'Not set'}
          />
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('deletageRegistration')}
            label="Delegate registration"
            value="TODO Not registered"
          />
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('removeAccount')}
            label="Account name"
            value=""
            buttonClass={classes.remove}
          />
        </div>
      </React.Fragment>
    );
  }
}

function SettingRow({
  classes,
  label,
  value,
  buttonClass,
  onClick
}: {
  classes: Record<
    'button' | 'content' | 'remove' | 'buttonContent' | 'arrow',
    string
  >;
  label: string;
  value: string;
  buttonClass?: string;
  onClick(): void;
}) {
  return (
    <Button
      name="name"
      variant="contained"
      className={classNames(
        classes.button,
        buttonClass,
      )}
      onClick={onClick}
    >
      <div className={classes.buttonContent}>
        <Typography component="span">{label}</Typography>
        <Typography component="span">
          {value}
          <ArrowFwd className={classes.arrow} />
        </Typography>
      </div>
    </Button>
  );
}

export default stylesDecorator(AccountSettings);
