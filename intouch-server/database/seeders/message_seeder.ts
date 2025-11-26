import { BaseSeeder } from '@adonisjs/lucid/seeders'

import User from '#models/user'
import Channel from '#models/channel'
import Message from '#models/message'
import Mention from '#models/mention'

export default class MessageSeeder extends BaseSeeder {
    public async run () {
        const david = await User.findByOrFail('email', 'david@example.com')
        const kristof = await User.findByOrFail('email', 'kristof@example.com')
        const lucia = await User.findByOrFail('nickname', 'lucia')
        const anna = await User.findByOrFail('nickname', 'anna')
        const martin = await User.findByOrFail('nickname', 'martin')
        const peter = await User.findByOrFail('nickname', 'peter')
        const jana = await User.findByOrFail('nickname', 'jana')
        const tomas = await User.findByOrFail('nickname', 'tomas')
        const zuzana = await User.findByOrFail('nickname', 'zuzana')
        const filip = await User.findByOrFail('nickname', 'filip')

        const vpwa = await Channel.findByOrFail('title', 'VPWA - projekt')
        const ceos = await Channel.findByOrFail('title', 'CEOs')
        const customerSuccess = await Channel.findByOrFail('title', 'Customer Success')
        const design = await Channel.findByOrFail('title', 'Design')
        const finance = await Channel.findByOrFail('title', 'Finance')
        const hr = await Channel.findByOrFail('title', 'HR')
        const secretAlpha = await Channel.findByOrFail('title', 'Alpha Squad')
        const secretBeta = await Channel.findByOrFail('title', 'Beta Experiments')
        const secretGamma = await Channel.findByOrFail('title', 'Gamma Secret Ops')

        const buildMessages = (
            channel: { id: number },
            senders: { id: number }[],
            baseTexts: string[],
            label: string
        ) => {
            const out: { senderId: number; channelId: number; content: string }[] = []
            const total = 30

            for (let i = 0; i < total; i++) {
                const baseText = baseTexts[i] ?? `${label} – seed správa ${i + 1}.`
                const sender = senders[i % senders.length]

                out.push({
                    senderId: sender.id,
                    channelId: channel.id,
                    content: baseText,
                })
            }

            return out
        }

        const ceosMessages = buildMessages(
            ceos,
            [peter, zuzana, david, kristof],
            [
                'Dobré ráno, dnes o 10:00 máme CEOs standup.',
                '@david priprav prosím krátky update k VPWA.',
                'Jasné, mám hotový prototyp a základ backendu.',
                'Super, chcem vidieť demo ešte tento týždeň.',
                'Za mňa dobré, vieme ukázať aj reálne správy v kanáloch. 😉',
                'Cieľ: nech sa tím cíti ako v Slacku, ale je to naše riešenie.',
                'Perfektné, ďakujem všetkým. 💡',
                'Pripravím aj krátku prezentáciu architektúry.',
            ],
            '#CEOs'
        )

        const customerSuccessMessages = buildMessages(
            customerSuccess,
            [kristof, jana, zuzana, david],
            [
                'Máme nový ticket od klienta ohľadom notifikácií na @mention.',
                'Klient chce dostávať e-mail len pri označení v správe.',
                'Implementujem prepínač „notifyOnMentionOnly“ do profilu.',
                'Super, odpíšem klientovi, že feature bude nasadená zajtra.',
                'Backend to už podporuje, stačí uložiť flag pre usera.',
                'Ďakujem, tím CS ❤️ vývoj.',
            ],
            '#Customer Success'
        )

        const designMessages = buildMessages(
            design,
            [lucia, anna, david, kristof],
            [
                'Pridala som nový layout pre sidebar podľa Figma návrhu.',
                'Animácie pri hoveri by mali byť jemnejšie.',
                'Skúsme zjednotiť oranžové odtiene naprieč aplikáciou.',
                'Do kanála #VPWA som dala exportované PNGčka.',
                'Za mňa je UI ready na prvý usability test.',
            ],
            '#Design'
        )

        const financeMessages = buildMessages(
            finance,
            [martin, david, peter],
            [
                'Potrebujem odhad času na dokončenie VPWA pre budget.',
                'Náklady na hosting budú približne rovnaké ako pri Slacksandboxe.',
                'Ak stihneme MVP do konca mesiaca, vieme to ukázať vedeniu.',
                'Pripravil som jednoduchý report pre projekt VPWA.',
            ],
            '#Finance'
        )

        const hrMessages = buildMessages(
            hr,
            [jana, kristof, david],
            [
                'Pripomínam, že zajtra máme teambuilding.',
                'Rozmýšľame, že VPWA použijeme aj na internú komunikáciu.',
                'Prosím, doplňte si fotky do profilov, nech to vyzerá živo.',
            ],
            '#HR'
        )

        const vpwaMessages = buildMessages(
            vpwa,
            [david, kristof, lucia, anna, tomas, filip],
            [
                'Stiahol som posledné zmeny z GitHubu, idem mergeovať.',
                'Potrebujeme ešte prepojiť Adonis a Quasar pre messages.',
                'Seedery už obsahujú reálne konverzácie pre každý kanál.',
                'Zajtra mám stretnutie so školiteľom, ukážem mu VPWA.',
            ],
            '#VPWA - projekt'
        )

        const alphaMessages = buildMessages(
            secretAlpha,
            [david, kristof, zuzana],
            [
                'Tento kanál je len pre Alpha Squad.',
                'Testujeme tu experimentálne features pred nasadením.',
            ],
            '#Alpha Squad'
        )

        const betaMessages = buildMessages(
            secretBeta,
            [anna, tomas, filip],
            [
                'Tu riešime všetky Beta Experiments.',
                'Ak niečo spadne, prosím logy do tohto kanála.',
            ],
            '#Beta Experiments'
        )

        const gammaMessages = buildMessages(
            secretGamma,
            [tomas, martin, david],
            [
                'Gamma Secret Ops je len pre infra veci.',
                'Dnes nasadzujeme novú verziu backendu.',
            ],
            '#Gamma Secret Ops'
        )

        const createdMessages = await Message.createMany([
            ...ceosMessages,
            ...customerSuccessMessages,
            ...designMessages,
            ...financeMessages,
            ...hrMessages,
            ...vpwaMessages,
            ...alphaMessages,
            ...betaMessages,
            ...gammaMessages,
        ])

        // Mentions - rovnaká logika ako v pôvodnom seederi
        const [
            mCeos2,
            mCs1,
            mDesign4,
            mHr1,
        ] = createdMessages

        await Mention.createMany([
            { messageId: mCeos2.id, userId: david.id },
            { messageId: mCs1.id, userId: david.id },
            { messageId: mDesign4.id, userId: lucia.id },
            { messageId: mHr1.id, userId: filip.id },
        ])

        console.log('✅ MessageSeeder (messages + mentions) finished')
    }
}
