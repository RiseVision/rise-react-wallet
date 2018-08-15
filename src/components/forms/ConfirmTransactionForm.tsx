import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import * as classNames from 'classnames';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { InjectedIntlProps, injectIntl, } from 'react-intl';
import { amountToUser } from '../../utils/utils';
import AccountIcon from '../AccountIcon';

const styles = (theme: Theme) =>
  createStyles({
    viz: {
      display: 'flex',
      flexDirection: 'row',
    },
    vizArrow: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2 * theme.spacing.unit,
      marginRight: 2 * theme.spacing.unit,
    },
    vizAmount: {
      paddingLeft: 16,
      paddingRight: 16,
      marginTop: '-1em',
    },
    arrow: {
      position: 'relative',
      height: 15,
      width: '100%',
      maxWidth: 120,
      '& > *': {
        borderColor: '#999',
      },
      '&$inactive > *': {
        borderColor: '#eee',
      },
    },
    inactive: {},
    arrowShaft: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 7,
      borderBottomWidth: 1,
      borderBottomStyle: 'solid',
      boxSizing: 'content-box',
    },
    arrowEnd: {
      position: 'absolute',
      top: 2,
      right: 0,
      width: 10,
      height: 10,
      borderTopWidth: 1,
      borderTopStyle: 'solid',
      borderRightWidth: 1,
      borderRightStyle: 'solid',
      transform: 'rotate(45deg)',
    },
    senderInfo: {
      textAlign: 'left',
    },
    recipientInfo: {
      textAlign: 'right',
    },
    accountAlias: {
      ...theme.typography.body2,
    },
    accountAddress: {
    },
    divider: {
      // Hack around the fact that the parent Dialog component
      // controls the content padding
      marginLeft: -2 * theme.spacing.unit,
      marginRight: -2 * theme.spacing.unit,
      // Adjust for the Grid margins
      marginTop: theme.spacing.unit,
      marginBottom: theme.spacing.unit,
    },
    txDetails: {
      textAlign: 'left',
    },
    txBreakdown: {
      textAlign: 'right',
      marginLeft: 'auto',
      // Display the cost breakdown as a table for easier visual digestion
      flex: 'none',
      display: 'table',
      '& > *': {
        display: 'table-row',
        '& > *': {
          display: 'table-cell',
          '&:first-child': {
            paddingRight: theme.spacing.unit,
          },
        },
      },
    },
    totalAmount: {
      fontWeight: 500,
    },
  });

type SendTxData = {
  kind: 'send';
  recipientId: string;
  recipient: string | null;
  amount: number;
};

type PassphraseTxData = {
  kind: 'passphrase';
};

type DelegateTxData = {
  kind: 'delegate';
  username: string;
};

type VoteTxData = {
  kind: 'vote';
  remove: string[];
  add: string[];
};

type TxData =
  | SendTxData
  | PassphraseTxData
  | DelegateTxData
  | VoteTxData;

interface Props extends WithStyles<typeof styles> {
  onSend: (state: State) => void;
  onRedo: (state: State) => void;
  onClose: () => void;
  data: TxData;
  fee: number;
  sender: string | null;
  senderId: string;
  isPassphraseSet: boolean;
  // progress state
  progress: ProgressState;
  // states data
  error?: string;
}

type DecoratedProps = Props & InjectedIntlProps;

export enum ProgressState {
  TO_CONFIRM,
  IN_PROGRESS,
  SUCCESS,
  ERROR
}

export interface State {
  passphrase: string;
  mnemonic: string;
}

const stylesDecorator = withStyles(styles);

@observer
class ConfirmTransactionForm extends React.Component<DecoratedProps, State> {
  state = {
    passphrase: '',
    mnemonic: ''
  };

  // TODO extract to Form
  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    const fields = ['passphrase', 'mnemonic'];
    if (fields.includes(field)) {
      // @ts-ignore TODO make it generic
      this.setState({
        [field]: value
      });
    }
  }

  onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (this.props.progress === ProgressState.SUCCESS) {
      this.props.onClose();
    } else if (this.props.progress === ProgressState.ERROR) {
      this.props.onRedo({ ...this.state });
    } else {
      this.props.onSend({ ...this.state });
    }
  }

  render() {
    const {
      intl,
      classes,
      isPassphraseSet,
      progress,
      senderId,
      fee,
      data,
      error,
      onClose,
    } = this.props;

    const total = fee + (data.kind === 'send' ? data.amount : 0);
    const recipientId = data.kind === 'send' ? data.recipientId : '';
    let sender = this.props.sender;
    if (!sender) {
      sender = 'Unnamed account';
    }
    let recipient = data.kind === 'send' ? data.recipient : null;
    if (!recipient) {
      recipient = 'Unknown recipient';
    }

    const formatAmount = (amount: number) => {
      return intl.formatNumber(amountToUser(amount));
    };

    return (
      <form onSubmit={this.onSubmit}>
        <Grid container={true} spacing={16}>
          <Grid
            item={true}
            xs={12}
            className={classes.viz}
            aria-label="Send transaction"
          >
            <AccountIcon size={64} address={senderId} />
            <div className={classes.vizArrow}>
              {data.kind === 'send' && (
                <Typography
                  className={classes.vizAmount}
                  aria-hidden={true}
                >
                  {formatAmount(data.amount)} RISE
                </Typography>
              )}
              <div
                className={classNames(
                  classes.arrow,
                  data.kind !== 'send' && classes.inactive,
                )}
              >
                <div className={classes.arrowShaft} />
                <div className={classes.arrowEnd} />
              </div>
            </div>
            <AccountIcon size={64} address={recipientId} />
          </Grid>
          <Grid
            item={true}
            xs={12}
            sm={6}
            className={classes.senderInfo}
            aria-label="From unnamed account (1234R)"
          >
            <Typography
              className={classes.accountAlias}
              aria-hidden={true}
            >
              {sender}
            </Typography>
            <Typography
              className={classes.accountAddress}
              aria-hidden={true}
            >
              {senderId}
            </Typography>
          </Grid>
          {data.kind === 'send' && (
            <Grid
              item={true}
              xs={12}
              sm={6}
              aria-label="To unnamed recipient (12345R)"
              className={classes.recipientInfo}
            >
              <Typography
                className={classes.accountAlias}
                aria-hidden={true}
              >
                {recipient}
              </Typography>
              <Typography
                className={classes.accountAddress}
                aria-hidden={true}
              >
                {recipientId}
              </Typography>
            </Grid>
          )}
        </Grid>
        {data.kind !== 'send' && (
          <React.Fragment>
            <Divider className={classes.divider} />
            <Grid
              container={true}
              spacing={16}
              className={classes.txDetails}
              aria-label="Transaction details"
            >
              <Grid item={true} xs={12}>
                <Typography>
                  Register as a delegate with username <em>USERNAME</em>.
                </Typography>
                <Typography>
                  Remove votes from <em>ex_rise</em>, <em>carpool</em>.
                </Typography>
                <Typography>
                  Cast vote for <em>riseSomeDele</em>.
                </Typography>
              </Grid>
            </Grid>
          </React.Fragment>
        )}
        <Divider className={classes.divider} />
        <Grid
          container={true}
          spacing={16}
        >
          <Grid
            item={true}
            xs={12}
            className={classes.txBreakdown}
            aria-label="Transaction cost breakdown"
          >
            {data.kind === 'send' && (
              <Typography>
                <span>Transfer amount:</span>
                {' '}
                <span>{formatAmount(data.amount)} RISE</span>
              </Typography>
            )}
            <Typography>
              <span>Network fee:</span>
              {' '}
              <span>{formatAmount(fee)} RISE</span>
            </Typography>
            <Typography>
              <span>Total:</span>
              {' '}
              <span className={classes.totalAmount}>{formatAmount(total)} RISE</span>
            </Typography>
          </Grid>
        </Grid>
        <Divider className={classes.divider} />
        {/* TODO icons */}
        {progress === ProgressState.ERROR && (
          <React.Fragment>
            <Typography>
              Failed to broadcast the transaction to the network
              {error ? `: ${error}` : ''}.
            </Typography>
            <div>
              <Button
                name="close"
                onClick={onClose}
                fullWidth={true}
              >
                CLOSE
              </Button>
              <Button name="redo" type="submit" fullWidth={true}>
                TRY AGAIN
              </Button>
            </div>
          </React.Fragment>
        )}
        {/* TODO icons */}
        {progress === ProgressState.SUCCESS && (
          <React.Fragment>
            <Typography>
              The transaction was successfully broadcast to the network!
            </Typography>
            <div>
              <Button type="submit" fullWidth={true} name="close">
                DONE
              </Button>
            </div>
          </React.Fragment>
        )}
        {/* TODO loading spinner */}
        {progress === ProgressState.IN_PROGRESS && (
          <React.Fragment>
            <Typography>
              Broadcasting transaction to the network.<br />Please wait...
            </Typography>
          </React.Fragment>
        )}
        {progress === ProgressState.TO_CONFIRM && (
          <React.Fragment>
            <Typography>
              To confirm this transaction, enter your mnemonic secret
              {isPassphraseSet ? ' and the 2nd passphrase ' : ''} in
              the input boxes below.
            </Typography>
            <TextField
              label="Account mnemonic secret"
              onChange={this.handleChange('mnemonic')}
              margin="normal"
              autoFocus={true}
              fullWidth={true}
            />
            {isPassphraseSet ? (
              <TextField
                label="Second passphrase"
                onChange={this.handleChange('passphrase')}
                margin="normal"
                fullWidth={true}
              />
            ) : null}
            <div>
              <Button name="send" type="submit" fullWidth={true}>
                SIGN &amp; BROADCAST
              </Button>
            </div>
          </React.Fragment>
        )}
      </form>
    );
  }
}

export default stylesDecorator(injectIntl(ConfirmTransactionForm));
