import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import {
  onboardingAddAccountRoute,
  onboardingSecurityNoticeRoute
} from '../../routes';
import App from '../../stores/app';

interface Props {
  store?: App;
}

@inject('store')
@observer
class NewAccountPage extends React.Component<Props> {
  handleBackClick = () => {
    this.props.store!.router.goTo(onboardingAddAccountRoute);
  }

  handleMnemonicClick = () => {
    this.props.store!.router.goTo(onboardingSecurityNoticeRoute);
  }

  render() {
    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backButton={true} onBackClick={this.handleBackClick}>
          <FormattedMessage
            id="onboarding-new-account.title"
            description="New account screen title"
            defaultMessage="New account"
          />
        </ModalPaperHeader>
        <List>
          <ListItem button={true} onClick={this.handleMnemonicClick}>
            <ListItemText
              primary={(
                <FormattedMessage
                  id="onboarding-new-account.using-mnemonic"
                  description="New account w/ a mnemonic button title"
                  defaultMessage="Create an account using a secret"
                />
              )}
              secondary={(
                <FormattedMessage
                  id="onboarding-new-account.using-mnemonic-tip"
                  description="New account w/ a mnemonic button tip"
                  defaultMessage={'I want to create a new account that '
                    + 'can be accessed using a mnemonic secret'}
                />
              )}
            />
            <ChevronRight />
          </ListItem>
          <ListItem button={true}>
            <ListItemText
              primary={(
                <FormattedMessage
                  id="onboarding-new-account.using-ledger"
                  description="New account w/ Ledger button title"
                  defaultMessage="Import an account from hardware wallet"
                />
              )}
              secondary={(
                <FormattedMessage
                  id="onboarding-new-account.using-ledger-tip"
                  description="New account w/ Ledger button tip"
                  defaultMessage={'I want to import a new account from my '
                    + 'Ledger hardware wallet'}
                />
              )}
            />
            <ChevronRight />
          </ListItem>
        </List>
      </ModalPaper>
    );
  }
}

export default NewAccountPage;
