import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import * as React from 'react';

const styles = createStyles({
  root: {
    minWidth: 240,
    width: '100%',
  },
  '@keyframes ledgerConfirm-button': {
    '50%': { transform: 'translateY(0px)' },
    '60%': { transform: 'translateY(5px)' },
    '70%': { transform: 'translateY(0px)' },
  },
  homeScreen: {
  },
  rightButton: {
    animation: 'ledgerConfirm-button 3s linear infinite',
  },
});

interface Props extends WithStyles<typeof styles> {
}

const stylesDecorator = withStyles(styles, { name: 'LedgerConfirmIllustration' });

class LedgerConfirmIllustration extends React.Component<Props> {
  render() {
    const { classes } = this.props;

    // Source SVG optimised with https://jakearchibald.github.io/svgomg/
    // and relevant animation groups injected by hand

    // tslint:disable:max-line-length
    return (
      <svg className={classes.root} height="90px" viewBox="160 55 240 90" aria-hidden={true}>
        <g fill="none" fillRule="evenodd">
          <g>
            <g transform="translate(-96 91)" fill="#2F2F2F" stroke="#434242">
              <path d="M.5 3.5h199v11H.5z"/>
              <rect x="187.5" y=".5" width="29" height="17" rx="4"/>
            </g>
            <g transform="translate(171 88)" fill="#D8D8D8" stroke="#979797">
              <rect x=".5" y=".5" width="24" height="23" rx="2"/>
              <path d="M.5 3.5h24v17H.5z"/>
            </g>
            <path d="M176 82.5h-60c-6.351 0-11.5 5.149-11.5 11.5v12c0 6.351 5.149 11.5 11.5 11.5h60a1.5 1.5 0 0 0 1.5-1.5V84a1.5 1.5 0 0 0-1.5-1.5z" stroke="#434242" fill="#2F2F2F"/>
          </g>
          <rect fill="#4C575B" x="212" y="83" width="130" height="34" rx="1"/>
          <g>
            <path d="M246.61 101.59l1.288-4.278h1.305l-1.98 5.688H246l-1.973-5.688h1.301l1.281 4.278zm5.742 1.488c-.62 0-1.125-.19-1.514-.57-.39-.38-.584-.887-.584-1.52v-.11c0-.424.082-.803.246-1.138.164-.334.397-.592.697-.773.301-.181.644-.272 1.03-.272.578 0 1.033.183 1.365.547.332.365.498.882.498 1.551v.46H251.4c.036.277.146.498.33.665.183.167.416.25.697.25.435 0 .775-.158 1.02-.473l.554.621c-.169.24-.398.427-.687.561-.29.134-.61.201-.961.201zm-.13-3.469a.707.707 0 0 0-.544.227c-.14.151-.229.367-.268.648h1.57v-.09c-.005-.25-.072-.443-.202-.58-.13-.136-.316-.205-.555-.205zm5.798.223a3.067 3.067 0 0 0-.406-.031c-.427 0-.707.144-.84.433V103h-1.129v-4.227h1.066l.032.504c.226-.388.54-.582.941-.582.125 0 .242.017.352.051l-.016 1.086zm2.649 3.168h-1.133v-4.227h1.133V103zm-1.2-5.32c0-.17.057-.309.17-.418.114-.11.268-.164.463-.164a.64.64 0 0 1 .461.164c.115.11.172.248.172.418a.554.554 0 0 1-.174.422.641.641 0 0 1-.459.164.641.641 0 0 1-.459-.164.554.554 0 0 1-.174-.422zm3.352 5.32v-3.398h-.629v-.829h.63v-.359c0-.474.135-.842.407-1.103.273-.262.653-.393 1.143-.393.156 0 .348.026.574.078l-.012.875a1.44 1.44 0 0 0-.343-.035c-.425 0-.637.2-.637.598v.34h.84v.828h-.84V103h-1.133zm5.051-1.598l.781-2.629h1.211l-1.699 4.883-.094.223c-.252.552-.669.828-1.25.828-.164 0-.33-.025-.5-.074v-.856l.172.004c.214 0 .373-.032.479-.097a.642.642 0 0 0 .248-.325l.133-.347-1.48-4.239h1.214l.785 2.63zm9.544.426h-2.055l-.39 1.172h-1.247l2.117-5.688h1.086l2.13 5.688h-1.247l-.394-1.172zm-1.739-.95h1.422l-.715-2.128-.707 2.129zm4.575-.023c0-.658.148-1.183.443-1.574.296-.39.7-.586 1.213-.586.411 0 .751.154 1.02.461V97h1.132v6h-1.02l-.054-.45a1.328 1.328 0 0 1-1.086.528c-.497 0-.896-.196-1.197-.588-.3-.392-.451-.937-.451-1.635zm1.129.083c0 .395.069.699.207.91.138.21.338.316.601.316.35 0 .595-.147.739-.441v-1.668c-.141-.295-.385-.442-.73-.442-.545 0-.817.442-.817 1.325zm4.293-.083c0-.658.148-1.183.443-1.574.296-.39.7-.586 1.213-.586.412 0 .751.154 1.02.461V97h1.132v6h-1.02l-.054-.45a1.328 1.328 0 0 1-1.086.528c-.497 0-.896-.196-1.197-.588-.3-.392-.451-.937-.451-1.635zm1.129.083c0 .395.069.699.207.91.138.21.338.316.601.316.35 0 .595-.147.739-.441v-1.668c-.141-.295-.384-.442-.73-.442-.545 0-.817.442-.817 1.325zm6.844-1.106a3.067 3.067 0 0 0-.406-.031c-.428 0-.708.144-.84.433V103h-1.13v-4.227h1.067l.031.504c.227-.388.54-.582.942-.582.125 0 .242.017.351.051l-.015 1.086zm3.328 3.246c-.62 0-1.124-.19-1.514-.57-.389-.38-.584-.887-.584-1.52v-.11c0-.424.082-.803.247-1.138.164-.334.396-.592.697-.773.3-.181.644-.272 1.03-.272.577 0 1.032.183 1.364.547.332.365.498.882.498 1.551v.46h-2.691c.036.277.146.498.33.665.184.167.416.25.697.25.435 0 .775-.158 1.02-.473l.555.621c-.17.24-.399.427-.688.561-.289.134-.61.201-.96.201zm-.129-3.469a.707.707 0 0 0-.545.227c-.139.151-.228.367-.267.648h1.57v-.09c-.005-.25-.073-.443-.203-.58-.13-.136-.315-.205-.555-.205zm5.711 2.223c0-.138-.068-.247-.205-.326-.136-.08-.356-.15-.658-.213-1.005-.211-1.508-.638-1.508-1.281 0-.375.156-.688.467-.94.311-.251.718-.377 1.22-.377.537 0 .966.127 1.288.38.321.252.482.58.482.984h-1.129a.546.546 0 0 0-.156-.4c-.104-.106-.267-.159-.488-.159-.19 0-.337.043-.442.129a.407.407 0 0 0-.156.328c0 .125.06.226.178.303.118.077.318.143.6.199.28.056.518.12.71.19.597.218.895.597.895 1.136 0 .386-.165.697-.496.936-.33.238-.758.357-1.281.357-.354 0-.669-.063-.944-.19-.274-.126-.49-.299-.646-.519a1.207 1.207 0 0 1-.235-.713h1.07c.011.2.085.354.223.461.138.107.323.16.555.16.216 0 .38-.04.49-.123a.383.383 0 0 0 .166-.322zm5.028 0c0-.138-.068-.247-.205-.326-.137-.08-.356-.15-.658-.213-1.006-.211-1.508-.638-1.508-1.281 0-.375.155-.688.467-.94.31-.251.718-.377 1.22-.377.537 0 .966.127 1.287.38.322.252.483.58.483.984h-1.129a.546.546 0 0 0-.156-.4c-.104-.106-.267-.159-.489-.159-.19 0-.337.043-.441.129a.407.407 0 0 0-.156.328c0 .125.059.226.178.303.118.077.318.143.6.199.28.056.517.12.71.19.596.218.895.597.895 1.136 0 .386-.166.697-.497.936-.33.238-.757.357-1.28.357-.355 0-.67-.063-.944-.19-.275-.126-.49-.299-.647-.519a1.207 1.207 0 0 1-.234-.713h1.07c.01.2.085.354.223.461.138.107.323.16.555.16.216 0 .38-.04.49-.123a.383.383 0 0 0 .166-.322z" fill="#A7CAED" />
            <path d="M221.082 100L218 96.918l3.082 3.082 3-3-3 3zm0 0l3.078 3.078-3.078-3.078-3.16 3.16 3.16-3.16zM335.367 97.206l-4.652 6.16-1.921-2.218" stroke="#A7CAED" strokeLinecap="square" />
          </g>
          <g className={classes.rightButton}>
            <rect stroke="#434242" strokeWidth="2" fill="#2F2F2F" x="331" y="62" width="18" height="8" rx="2"/>
          </g>
          <g>
            <rect stroke="#434242" strokeWidth="2" fill="#2F2F2F" x="205" y="62" width="18" height="8" rx="2"/>
          </g>
          <path d="M184 67a3 3 0 0 0-3 3v60a3 3 0 0 0 3 3h246a3 3 0 0 0 3-3V70a3 3 0 0 0-3-3H184zm30 16h126a2 2 0 0 1 2 2v30a2 2 0 0 1-2 2H214a2 2 0 0 1-2-2V85a2 2 0 0 1 2-2zm186 35c-9.941 0-18-8.059-18-18s8.059-18 18-18 18 8.059 18 18-8.059 18-18 18z" stroke="#434242" strokeWidth="2" fill="#2F2F2F"/>
          <path d="M400 132h222a3 3 0 0 0 3-3V71a3 3 0 0 0-3-3H400c-17.673 0-32 14.327-32 32 0 17.673 14.327 32 32 32zm0-9c-12.703 0-23-10.297-23-23s10.297-23 23-23 23 10.297 23 23-10.297 23-23 23z" stroke="#AEAEAE" strokeWidth="2" fill="#C7C7C7"/>
        </g>
      </svg>
    );
    // tslint:enable:max-line-length
  }
}

export default stylesDecorator(LedgerConfirmIllustration);
