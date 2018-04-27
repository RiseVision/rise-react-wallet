import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import List, { ListItem, ListItemText } from 'material-ui/List';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';

interface Props {
  onGoBack: () => void;
  onGenerateMnemonic: () => void;
}

class OnboardingNewAccountPage extends React.Component<Props> {
  handleBackClick = () => {
    this.props.onGoBack();
  }

  handleMnemonicClick = () => {
    this.props.onGenerateMnemonic();
  }

  render() {
    return (
      <ModalPaper>
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

export default OnboardingNewAccountPage;
