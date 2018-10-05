import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ChevronRight from '@material-ui/icons/ChevronRight';
import { observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Link from '../../components/Link';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import {
  onboardingAddAccountRoute,
  onboardingSecurityNoticeRoute,
  onboardingLedgerAccount
} from '../../routes';

interface Props {}

@observer
class NewAccountPage extends React.Component<Props> {
  render() {
    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backLink={{ route: onboardingAddAccountRoute }}>
          <FormattedMessage
            id="onboarding-new-account.title"
            description="New account screen title"
            defaultMessage="New account"
          />
        </ModalPaperHeader>
        <List>
          <Link route={onboardingSecurityNoticeRoute}>
            <ListItem button={true}>
              <ListItemText
                primary={
                  <FormattedMessage
                    id="onboarding-new-account.using-mnemonic"
                    description="New account w/ a mnemonic button title"
                    defaultMessage="Create an account using a secret"
                  />
                }
                secondary={
                  <FormattedMessage
                    id="onboarding-new-account.using-mnemonic-tip"
                    description="New account w/ a mnemonic button tip"
                    defaultMessage={
                      'I want to create a new account that ' +
                      'can be accessed using a mnemonic secret'
                    }
                  />
                }
              />
              <ChevronRight />
            </ListItem>
          </Link>
          <Link route={onboardingLedgerAccount}>
            <ListItem button={true}>
              <ListItemText
                primary={
                  <FormattedMessage
                    id="onboarding-new-account.using-ledger"
                    description="New account w/ Ledger button title"
                    defaultMessage="Import an account from hardware wallet"
                  />
                }
                secondary={
                  <FormattedMessage
                    id="onboarding-new-account.using-ledger-tip"
                    description="New account w/ Ledger button tip"
                    defaultMessage={
                      'I want to import a new account from my ' +
                      'Ledger hardware wallet'
                    }
                  />
                }
              />
              <ChevronRight />
            </ListItem>
          </Link>
        </List>
      </ModalPaper>
    );
  }
}

export default NewAccountPage;
