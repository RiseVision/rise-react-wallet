import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import AccountIcon from '../../components/AccountIcon';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import {
  onboardingAddAccountRoute,
  onboardingExistingAccountTypeRoute
} from '../../routes';
import Store from '../../stores/store';
import UserStore from '../../stores/user';

const styles = createStyles({
  content: {
    padding: 20
  },
  accountContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  accountField: {
    flex: 1
  },
  accountIcon: {
    marginLeft: 10
  }
});

interface Props extends WithStyles<typeof styles> {
  store?: Store;
  accountAddress?: string;
}

interface State {
  address: string;
  addressInvalid: boolean;
  normalizedAddress: string;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingExistingAccountPage'
});

@inject('store')
@observer
class ExistingAccountPage extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    const address = props.accountAddress || '';
    this.state = {
      address,
      addressInvalid: false,
      normalizedAddress: normalizeAddress(address)
    };
  }

  handleBackClick = () => {
    this.props.store!.router.goTo(onboardingAddAccountRoute);
  }

  handleFormSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { normalizedAddress } = this.state;
    const addressInvalid = !normalizedAddress;
    if (addressInvalid) {
      this.setState({ addressInvalid: true });
      return;
    }

    this.props.store!.address = normalizedAddress;
    this.props.store!.router.goTo(onboardingExistingAccountTypeRoute);
  }

  handleAddressChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const address = ev.target.value;
    const normalizedAddress = normalizeAddress(address);

    this.setState({
      address,
      addressInvalid: false,
      normalizedAddress
    });
  }

  handleAddressBlur = () => {
    const { address, normalizedAddress } = this.state;
    const addressInvalid = !!address && !normalizedAddress;
    this.setState({ addressInvalid });
  }

  render() {
    const { classes } = this.props;
    const { address, addressInvalid, normalizedAddress } = this.state;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backButton={true} onBackClick={this.handleBackClick}>
          <FormattedMessage
            id="onboarding-existing-account.title"
            description="Existing account screen title"
            defaultMessage="Existing account"
          />
        </ModalPaperHeader>
        <Grid
          container={true}
          className={classes.content}
          spacing={16}
          component="form"
          onSubmit={this.handleFormSubmit}
        >
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="onboarding-existing-account.enter-address-text"
                description="Text asking the user to fill the input field"
                defaultMessage="Enter the address of an existing RISE account you wish to access:"
              />
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <div className={classes.accountContainer}>
              <TextField
                className={classes.accountField}
                label={
                  <FormattedMessage
                    id="onboarding-existing-account.address-input-label"
                    description="Account address input label"
                    defaultMessage="Account address"
                  />
                }
                error={addressInvalid}
                value={address}
                onChange={this.handleAddressChange}
                onBlur={this.handleAddressBlur}
              />
              <AccountIcon
                className={classes.accountIcon}
                size={48}
                address={normalizedAddress}
              />
            </div>
          </Grid>
          <Grid item={true} xs={12}>
            <Button type="submit" fullWidth={true}>
              <FormattedMessage
                id="onboarding-existing-account.continue"
                description="Continue button label"
                defaultMessage="Continue"
              />
            </Button>
          </Grid>
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="onboarding-existing-account.recover-from-mnemonic"
                description="Instructions for people who forgot their account address"
                defaultMessage="Forgotten your address but have your secret mnemonic? Click here"
              />
            </Typography>
          </Grid>
        </Grid>
      </ModalPaper>
    );
  }
}

function normalizeAddress(address: string): string {
  const normalizedAddress = address.toUpperCase();
  if (!normalizedAddress.match(/^\d{1,20}R$/)) {
    return '';
  } else {
    return normalizedAddress;
  }
}

// TODO make it a decorator
export default stylesDecorator(ExistingAccountPage);
