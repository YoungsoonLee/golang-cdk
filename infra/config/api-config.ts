var convict = require('convict');

export const config = (env:string, market:string) => {
    const convictConfig = convict({
        slackHookUrl: {
            doc: 'Slack hook URL to send notification',
            format: String,
            default: "",
        }
    });

    //convictConfig.loadFile(`./config/cdk/${env}-${market}-config.json`);

    // perform validation
    convictConfig.validate({allowed: 'strict'});
    return convictConfig;
}

