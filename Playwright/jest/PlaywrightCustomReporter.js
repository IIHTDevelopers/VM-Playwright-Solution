const fs = require('fs');
const xmlBuilder = require('xmlbuilder');
let createXMLFile = false;
let customData = '';

// Define TestCaseResultDto class
class TestCaseResultDto {
    constructor() {
        this.methodName = '';
        this.methodType = '';
        this.actualScore = 0;
        this.earnedScore = 0;
        this.status = '';
        this.isMandatory = true;
        this.erroMessage = '';
    }
}

// Define TestResults class
class TestResults {
    constructor() {
        this.testCaseResults = '';
        this.customData = '';
    }
}

class PlaywrightCustomReporter {
    constructor(options) {
        this.xml = xmlBuilder.create('test-cases');
        this.outputFiles = {
            business: './output_revised.txt',
            boundary: './output_boundary_revised.txt',
            exception: './output_exception_revised.txt',
            xml: './yaksha-test-cases.xml',
        };

        // Read custom data if exists
        try {
            const data = fs.readFileSync('../../custom.ih', 'utf8');
            customData = data;
        } catch (err) {
            console.error(err);
        }
    }

    // Function to clear old output files at the start of a test run
    clearOutputFiles() {
        for (let key in this.outputFiles) {
            if (fs.existsSync(this.outputFiles[key])) {
                fs.unlinkSync(this.outputFiles[key]);
                console.log(`Cleared existing file: ${this.outputFiles[key]}`);
            }
        }
    }

    onBegin(config, suite) {
        console.log('Test suite started');
        // Clear output files before starting the test run
        this.clearOutputFiles();
    }

    onTestEnd(test, result) {
        const testName = test.title.trim();
        const fileName = testName.split(' ')[1]?.toLowerCase(); // Extract the category as file name

        let test_Results = new TestResults();
        let testCaseResults = {};
        let resultStatus = result.status === 'passed' ? 'Passed' : 'Failed';
        let resultScore = result.status === 'passed' ? 1 : 0;

        let testCaseResult_Dto = new TestCaseResultDto();
        testCaseResult_Dto.methodName = camelCase(testName);
        testCaseResult_Dto.methodType = fileName;
        testCaseResult_Dto.actualScore = 1;
        testCaseResult_Dto.earnedScore = resultScore;
        testCaseResult_Dto.status = resultStatus;
        testCaseResult_Dto.isMandatory = true;
        testCaseResult_Dto.erroMessage = result.error ? result.error.message : '';

        const GUID = 'd907aa7b-3b6d-4940-8d09-28329ccbc070';
        testCaseResults[GUID] = testCaseResult_Dto;

        test_Results.testCaseResults = JSON.stringify(testCaseResults);
        test_Results.customData = customData;

        const finalResult = JSON.stringify(test_Results);
        fs.appendFileSync('./test.txt', finalResult); // Main log file for all results

        const fileOutput = `${camelCase(testName)}=${result.status === 'passed'}`;
        const outputFile = this.outputFiles[fileName] || './output_boundary_revised.txt'; // Fallback to boundary file

        // Append to the relevant file or fallback file
        fs.appendFileSync(outputFile, `${fileOutput}\n`);
        console.log(`Writing to file: ${outputFile} with content: ${fileOutput}`);

        // Prepare XML entry for each test
        prepareXmlFile(this.xml, test);

        // Send the results to the server using XMLHttpRequest
        const XMLHttpRequest = require('xhr2');
        const xhr = new XMLHttpRequest();
        const url =
            'https://yaksha-prod-sbfn.azurewebsites.net/api/YakshaMFAEnqueue?code=jSTWTxtQ8kZgQ5FC0oLgoSgZG7UoU9Asnmxgp6hLLvYId/GW9ccoLw==';
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    fs.appendFileSync(
                        './test.txt',
                        `\nSERVER RESPONSE: ${JSON.stringify(xhr.responseText)}`
                    );
                    console.log('Successfully sent data to the server');
                } else {
                    fs.appendFileSync(
                        './test.txt',
                        `\nSERVER ERROR: ${xhr.status} - ${xhr.statusText}`
                    );
                    console.error('Failed to send data to the server');
                }
            }
        };
        xhr.send(JSON.stringify(test_Results));
    }

    onEnd() {
        if (createXMLFile) {
            fs.writeFileSync(this.outputFiles.xml, this.xml.toString({ pretty: true }));
        }
        console.log('Test suite ended');
    }
}

// Utility function to capitalize words
const capitalize = (str) => str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();

// Utility function to convert a string to camelCase
const camelCase = (str) =>
    str
        .split(' ')
        .map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word)))
        .join('');

// Function to prepare the XML structure for each test
const prepareXmlFile = (xml, test) => {
    const testCaseType = test.title.trim().split(' ')[1];
    xml
        .ele('cases', {
            'xmlns:java': 'http://java.sun.com',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'xsi:type': 'java:com.assessment.data.TestCase',
        })
        .ele(
            'test-case-type',
            capitalize(
                testCaseType === 'business'
                    ? 'functional'
                    : testCaseType === 'exception'
                        ? 'exception'
                        : 'boundary'
            )
        )
        .up()
        .ele('expected-ouput', true)
        .up()
        .ele('name', camelCase(test.title.trim()))
        .up()
        .ele('weight', 2)
        .up()
        .ele('mandatory', true)
        .up()
        .ele('desc', 'na')
        .end();
};

module.exports = PlaywrightCustomReporter;


// const fs = require('fs');
// const xmlBuilder = require('xmlbuilder');
// const axios = require('axios'); // Use axios for HTTP requests
// let createXMLFile = false;
// let customData = '';

// // Define TestCaseResultDto class
// class TestCaseResultDto {
//     constructor() {
//         this.methodName = '';
//         this.methodType = '';
//         this.actualScore = 0;
//         this.earnedScore = 0;
//         this.status = '';
//         this.isMandatory = true;
//         this.erroMessage = '';
//     }
// }

// // Define TestResults class
// class TestResults {
//     constructor() {
//         this.testCaseResults = '';
//         this.customData = '';
//     }
// }

// class PlaywrightCustomReporter {
//     constructor(options) {
//         this.xml = xmlBuilder.create('test-cases');
//         this.outputFiles = {
//             business: './output_revised.txt',
//             boundary: './output_boundary_revised.txt',
//             exception: './output_exception_revised.txt',
//             xml: './yaksha-test-cases.xml',
//         };

//         // Read custom data if exists
//         try {
//             const data = fs.readFileSync('../custom.ih', 'utf8');
//             customData = data;
//         } catch (err) {
//             console.error(err);
//         }
//     }

//     // Function to clear old output files at the start of a test run
//     clearOutputFiles() {
//         for (let key in this.outputFiles) {
//             if (fs.existsSync(this.outputFiles[key])) {
//                 fs.unlinkSync(this.outputFiles[key]);
//                 console.log(`Cleared existing file: ${this.outputFiles[key]}`);
//             }
//         }
//     }

//     onBegin(config, suite) {
//         console.log('Test suite started');
//         // Clear output files before starting the test run
//         this.clearOutputFiles();
//     }

//     async onTestEnd(test, result) {
//         const testName = test.title.trim();
//         const fileName = testName.split(' ')[1]?.toLowerCase(); // Extract the category as file name

//         let test_Results = new TestResults();
//         let testCaseResults = {};
//         let resultStatus = result.status === 'passed' ? 'Passed' : 'Failed';
//         let resultScore = result.status === 'passed' ? 1 : 0;

//         let testCaseResult_Dto = new TestCaseResultDto();
//         testCaseResult_Dto.methodName = camelCase(testName);
//         testCaseResult_Dto.methodType = fileName;
//         testCaseResult_Dto.actualScore = 1;
//         testCaseResult_Dto.earnedScore = resultScore;
//         testCaseResult_Dto.status = resultStatus;
//         testCaseResult_Dto.isMandatory = true;
//         testCaseResult_Dto.erroMessage = result.error ? result.error.message : '';

//         const GUID = 'd907aa7b-3b6d-4940-8d09-28329ccbc070';
//         testCaseResults[GUID] = testCaseResult_Dto;

//         test_Results.testCaseResults = JSON.stringify(testCaseResults);
//         test_Results.customData = customData;

//         const finalResult = JSON.stringify(test_Results);
//         fs.appendFileSync('./test.txt', finalResult); // Main log file for all results

//         const fileOutput = `${camelCase(testName)}=${result.status === 'passed'}`;
//         const outputFile = this.outputFiles[fileName] || './output_boundary_revised.txt'; // Fallback to boundary file

//         // Append to the relevant file or fallback file
//         fs.appendFileSync(outputFile, `${fileOutput}\n`);
//         console.log(`Writing to file: ${outputFile} with content: ${fileOutput}`);

//         // Prepare XML entry for each test
//         prepareXmlFile(this.xml, test);

//         // Send the results to the server
//         try {
//             const response = await axios.post(
//                 'https://yaksha-prod-sbfn.azurewebsites.net/api/YakshaMFAEnqueue?code=jSTWTxtQ8kZgQ5FC0oLgoSgZG7UoU9Asnmxgp6hLLvYId/GW9ccoLw==',
//                 test_Results,
//                 {
//                     headers: { 'Content-Type': 'application/json' },
//                 }
//             );
//             fs.appendFileSync('./test.txt', `\nSERVER RESPONSE: ${JSON.stringify(response.data)}`);
//             console.log('Successfully sent data to the server');
//         } catch (error) {
//             fs.appendFileSync('./test.txt', `\nSERVER ERROR: ${error.message}`);
//             console.error('Failed to send data to the server', error);
//         }
//     }

//     onEnd() {
//         if (createXMLFile) {
//             fs.writeFileSync(this.outputFiles.xml, this.xml.toString({ pretty: true }));
//         }
//         console.log('Test suite ended');
//     }
// }

// // Utility function to capitalize words
// const capitalize = (str) => str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();

// // Utility function to convert a string to camelCase
// const camelCase = (str) =>
//     str
//         .split(' ')
//         .map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word)))
//         .join('');

// // Function to prepare the XML structure for each test
// const prepareXmlFile = (xml, test) => {
//     const testCaseType = test.title.trim().split(' ')[1];
//     xml
//         .ele('cases', {
//             'xmlns:java': 'http://java.sun.com',
//             'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
//             'xsi:type': 'java:com.assessment.data.TestCase',
//         })
//         .ele(
//             'test-case-type',
//             capitalize(
//                 testCaseType === 'business'
//                     ? 'functional'
//                     : testCaseType === 'exception'
//                         ? 'exception'
//                         : 'boundary'
//             )
//         )
//         .up()
//         .ele('expected-ouput', true)
//         .up()
//         .ele('name', camelCase(test.title.trim()))
//         .up()
//         .ele('weight', 2)
//         .up()
//         .ele('mandatory', true)
//         .up()
//         .ele('desc', 'na')
//         .end();
// };

// module.exports = PlaywrightCustomReporter;





// const fs = require('fs');
// const xmlBuilder = require('xmlbuilder');
// let createXMLFile = false;
// let customData = '';

// // Define TestCaseResultDto class
// class TestCaseResultDto {
//   constructor() {
//     this.methodName = '';
//     this.methodType = '';
//     this.actualScore = 0;
//     this.earnedScore = 0;
//     this.status = '';
//     this.isMandatory = true;
//     this.erroMessage = '';
//   }
// }

// // Define TestResults class
// class TestResults {
//   constructor() {
//     this.testCaseResults = '';
//     this.customData = '';
//   }
// }

// class PlaywrightCustomReporter {
//   constructor(options) {
//     this.xml = xmlBuilder.create('test-cases');
//     this.outputFiles = {
//       business: './output_revised.txt',
//       boundary: './output_boundary_revised.txt',
//       exception: './output_exception_revised.txt',
//       xml: './yaksha-test-cases.xml',
//     };

//     // Read custom data if exists
//     try {
//       const data = fs.readFileSync('../custom.ih', 'utf8');
//       customData = data;
//     } catch (err) {
//       console.error(err);
//     }
//   }

//   // Function to clear old output files at the start of a test run
//   clearOutputFiles() {
//     for (let key in this.outputFiles) {
//       if (fs.existsSync(this.outputFiles[key])) {
//         fs.unlinkSync(this.outputFiles[key]);
//         console.log(`Cleared existing file: ${this.outputFiles[key]}`);
//       }
//     }
//   }

//   onBegin(config, suite) {
//     console.log('Test suite started');
//     // Clear output files before starting the test run
//     this.clearOutputFiles();
//   }

//   onTestEnd(test, result) {
//     const testName = test.title.trim();
//     const fileName = testName.split(' ')[1]?.toLowerCase(); // Extract the category as file name

//     let test_Results = new TestResults();
//     let testCaseResults = {};
//     let resultStatus = result.status === 'passed' ? 'Passed' : 'Failed';
//     let resultScore = result.status === 'passed' ? 1 : 0;

//     let testCaseResult_Dto = new TestCaseResultDto();
//     testCaseResult_Dto.methodName = camelCase(testName);
//     testCaseResult_Dto.methodType = fileName;
//     testCaseResult_Dto.actualScore = 1;
//     testCaseResult_Dto.earnedScore = resultScore;
//     testCaseResult_Dto.status = resultStatus;
//     testCaseResult_Dto.isMandatory = true;
//     testCaseResult_Dto.erroMessage = result.error ? result.error.message : '';

//     const GUID = 'd907aa7b-3b6d-4940-8d09-28329ccbc070';
//     testCaseResults[GUID] = testCaseResult_Dto;

//     test_Results.testCaseResults = JSON.stringify(testCaseResults);
//     test_Results.customData = customData;

//     const finalResult = JSON.stringify(test_Results);
//     fs.appendFileSync('./test.txt', finalResult); // Main log file for all results

//     const fileOutput = `${camelCase(testName)}=${result.status === 'passed'}`;
//     const outputFile = this.outputFiles[fileName] || './output_boundary_revised.txt'; // Fallback to boundary file

//     // Append to the relevant file or fallback file
//     fs.appendFileSync(outputFile, `${fileOutput}\n`);
//     console.log(`Writing to file: ${outputFile} with content: ${fileOutput}`);

//     // Prepare XML entry for each test
//     prepareXmlFile(this.xml, test);
//   }

//   onEnd() {
//     if (createXMLFile) {
//       fs.writeFileSync(this.outputFiles.xml, this.xml.toString({ pretty: true }));
//     }
//     console.log('Test suite ended');
//   }
// }

// // Utility function to capitalize words
// const capitalize = (str) => str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();

// // Utility function to convert a string to camelCase
// const camelCase = (str) =>
//   str
//     .split(' ')
//     .map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word)))
//     .join('');

// // Function to prepare the XML structure for each test
// const prepareXmlFile = (xml, test) => {
//   const testCaseType = test.title.trim().split(' ')[1];
//   xml
//     .ele('cases', {
//       'xmlns:java': 'http://java.sun.com',
//       'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
//       'xsi:type': 'java:com.assessment.data.TestCase',
//     })
//     .ele(
//       'test-case-type',
//       capitalize(
//         testCaseType === 'business'
//           ? 'functional'
//           : testCaseType === 'exception'
//             ? 'exception'
//             : 'boundary'
//       )
//     )
//     .up()
//     .ele('expected-ouput', true)
//     .up()
//     .ele('name', camelCase(test.title.trim()))
//     .up()
//     .ele('weight', 2)
//     .up()
//     .ele('mandatory', true)
//     .up()
//     .ele('desc', 'na')
//     .end();
// };

// module.exports = PlaywrightCustomReporter;
