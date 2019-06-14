import * as assert from 'assert';
import { Checkbox, Theme } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { saveAs } from 'file-saver';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as moment from 'moment';
import * as React from 'react';
import { ChangeEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { onboardingAddAccountRoute } from '../../routes';
import AddressBookStore from '../../stores/addressBook';
import WalletStore from '../../stores/wallet';

const styles = (theme: Theme) => {
  return createStyles({
    content: {
      padding: 20
    },
    input: {
      paddingTop: 0,
      paddingBottom: 0
    },
    divider: {
      marginTop: '1em',
      marginBottom: '1em'
    },
    checkbox: {
      textAlign: 'left',
      width: '100%'
    },
    overrideInfo: {
      color: theme.palette.error.main,
      fontWeight: 'bold'
    }
  });
};

interface Props extends WithStyles<typeof styles> {}

interface PropsInjected extends Props {
  addressBookStore: AddressBookStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

interface State {
  importOverride: boolean;
  exportContactsChecked: boolean;
  importSuccess: boolean;
  importError: boolean;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingChooseLanguagePage'
});

@inject('addressBookStore')
@inject('routerStore')
@inject('walletStore')
@observer
class ImportExportPage extends React.Component<Props, State> {
  state = {
    importOverride: false,
    importSuccess: false,
    importError: false,
    exportContactsChecked: true
  };

  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      assert(files);
      assert(files!.length);
      const reader = new FileReader();
      const { walletStore } = this.injected;
      const onload = new Promise((resolve, reject) => {
        // @ts-ignore
        reader.onload = (e: ProgressEvent) => resolve(e.target.result);
        reader.onerror = reject;
      });
      reader.readAsText(files![0]);
      // @ts-ignore
      const result: string = await onload;
      const json = JSON.parse(result);
      const overrideExisting = false;
      walletStore.importData(json, overrideExisting);
      this.setState({
        importSuccess: true,
        importError: false
      });
    } catch (e) {
      this.setState({
        importSuccess: false,
        importError: true
      });
    }
  };

  handleExport = (event: React.MouseEvent<HTMLElement>) => {
    const { exportContactsChecked } = this.state;
    const json = this.injected.walletStore.exportData(exportContactsChecked);
    const blob = new Blob([JSON.stringify(json, null, 4)], {
      type: 'application/json'
    });
    saveAs(blob, `rise-wallet-${moment().toISOString()}.json`);
  };

  handleImportOverrideClick = (ev: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      importOverride: !this.state.importOverride
    });
  };

  handleExportContactsClick = (ev: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      exportContactsChecked: !this.state.exportContactsChecked
    });
  };

  render() {
    const { classes } = this.injected;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backLink={{ route: onboardingAddAccountRoute }}>
          <FormattedMessage
            id="onboarding-import-export.title"
            description="Import / Export screen title"
            defaultMessage="Import / Export"
          />
        </ModalPaperHeader>
        <form className={classes.content}>
          <Typography>
            <FormattedMessage
              id="onboarding-import-export.import-msg"
              description="Text describing importing"
              defaultMessage="Import accounts & contacts from a file:"
            />
          </Typography>

          {/* IMPORT */}
          {this.renderImport()}

          {/* EXPORT */}
          {this.renderExport()}
        </form>
      </ModalPaper>
    );
  }

  private renderImport() {
    const { classes } = this.injected;

    const { importOverride, importError, importSuccess } = this.state;

    return (
      <div>
        <input
          accept="application/json"
          className={classes.input}
          onChange={this.handleImport}
          style={{ display: 'none' }}
          type="file"
          id="import-data-file"
        />

        <FormControlLabel
          className={classes.checkbox}
          control={
            <Checkbox
              checked={importOverride}
              onChange={this.handleImportOverrideClick}
            />
          }
          label={
            <FormattedMessage
              id="onboarding-import-export.import-override"
              description="Checkbox asking about overriding existing data"
              defaultMessage="Override existing"
            />
          }
        />
        {importOverride && (
          <Typography className={classes.overrideInfo}>
            <FormattedMessage
              id="onboarding-import-export.import-override"
              description={
                "Notice emphasizing that there's no undo after overriding"
              }
              defaultMessage="Overriding cannot be undone!"
            />
          </Typography>
        )}

        <label htmlFor="import-data-file">
          <Button component="span" fullWidth={true}>
            <FormattedMessage
              id="onboarding-import-export.title"
              description="Choose network screen title"
              defaultMessage="Upload"
            />
          </Button>
        </label>

        {importSuccess && (
          <Typography>
            <FormattedMessage
              id="onboarding-import-export.import-success"
              description="Message when import was successful"
              defaultMessage="Import completed!"
            />
          </Typography>
        )}

        {importError && (
          <Typography>
            <FormattedMessage
              id="onboarding-import-export.import-error"
              description="Message when import was NOT successful"
              defaultMessage={
                "Something wen't wrong. Check the file and try again."
              }
            />
          </Typography>
        )}
      </div>
    );
  }

  private renderExport() {
    const { classes, walletStore, addressBookStore } = this.injected;

    const { exportContactsChecked } = this.state;

    const exportPossible = Boolean(
      walletStore.accounts.size || addressBookStore.asArray.length
    );

    if (!exportPossible) {
      return false;
    }

    return (
      <React.Fragment>
        <Divider className={classes.divider} />
        <Typography>
          <FormattedMessage
            id="onboarding-import-export.export-msg"
            description="Text describing exporting"
            defaultMessage="Export accounts & contacts to a file:"
          />
        </Typography>
        <div>
          <FormControlLabel
            className={classes.checkbox}
            control={
              <Checkbox
                checked={exportContactsChecked}
                onChange={this.handleExportContactsClick}
              />
            }
            label={
              <FormattedMessage
                id="onboarding-import-export.export-contacts"
                description="Checkbox asking about exporting contacts"
                defaultMessage="Export contacts"
              />
            }
          />

          <Button component="span" fullWidth={true} onClick={this.handleExport}>
            <FormattedMessage
              id="onboarding-import-export.title"
              description="Choose network screen title"
              defaultMessage="Download"
            />
          </Button>
        </div>
      </React.Fragment>
    );
  }
}

export default stylesDecorator(ImportExportPage);
