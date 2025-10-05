import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, BookOpen, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function Manifesto() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <BookOpen className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Coherosphere Manifesto
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          For a future where humanity, technology, and values resonate.
        </p>
      </div>

      {/* Manifesto Content */}
      <div className="max-w-6xl mx-auto">
        {/* On-Chain Badge - now centered with content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-orange-500/10 border-orange-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-orange-400 mt-1 flex-shrink-0" />
                <div>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 mb-3">
                    On-Chain Version
                  </Badge>
                  <p className="text-slate-300 leading-relaxed">
                    With Block 914508, the current version of the Manifesto was written into the Bitcoin blockchain, 
                    ensuring permanent, tamper-proof preservation of our foundational principles.
                  </p>
                  <a
                    href="https://ordiscan.com/inscription/106004490"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-orange-400 hover:text-orange-300 transition-colors font-medium"
                  >
                    View On-Chain Inscription
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="prose prose-slate max-w-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="space-y-8 text-slate-300 leading-relaxed">
            
            {/* Opening Statement */}
            <section className="text-lg leading-relaxed">
              <p className="mb-6">
                We stand at the threshold of a profound transformation—shaped by intertwined forces: accelerating AI, a fragile political order, and a fiat monetary system that concentrates risk and power. If we do not realign all three, we risk not only economic and social disruption but also the erosion of meaning, freedom, identity, and agency. AI and automation will continue to remap work and value; yet it is governance and money that decide whether this shift leads to mass precarity or shared prosperity. The very tools that can liberate time and creativity can just as easily centralize control—unless we pair technological progress with transparent, community-led, decentralized governance and hard, tamper-resistant assets. In the coherosphere, we choose the latter: technology that serves people, communities that co-govern, and a monetary foundation that cannot be debased or seized.
              </p>
              <p className="mb-6">
                Already today, AI-driven crises are emerging. Ever more powerful systems and automation threaten millions of jobs—mass unemployment and historic inequality could follow. For many, work provides meaning and structure; yet if 99% of people can no longer find meaningful employment, we face a crisis of purpose on an unprecedented scale. At the same time, careless use of AI undermines our mental health and autonomy. Those who constantly outsource their problems to machines unlearn resilience, empathy, and the ability to cope with stress. Studies show that AI tools can weaken our focus and creativity. Loneliness looms when virtual AI "friends" replace genuine relationships. Meanwhile, power over AI is concentrating in the hands of a few tech giants and states. If these advanced systems remain controlled by narrow corporate or political interests, unchecked surveillance and an erosion of freedom loom large. Uncontrolled superintelligences pose an even greater danger: if we fail to set boundaries, they may slip beyond our control. And the flood of synthetic information shakes our collective orientation: deepfakes and AI-generated content blur truth and lies, shared values and narratives falter, and even the education system drifts into crisis.
              </p>
              <p>
                But this future is not inevitable. This manifesto is a call to action – a call to face these crises with courage and collective effort, and to forge a new path forward. To transform looming disintegration into cohesion and meaning, we have coined the term <span className="text-orange-400 font-semibold">coherosphere</span> and founded a decentralized collective under this name. coherosphere is a collective endeavor, not a personal project. In the tradition of atmosphere, biosphere, and noosphere, we understand the coherosphere as an independent evolutionary sphere where technology, values, community, and meaning resonate in harmony. The coherosphere embodies coherence, purpose, and collective agency – a space where fragmentation turns into connection, and diversity becomes a meaningful whole. It represents the next stage of development in the age of AI – our response to the crisis of meaning, loss of control, and fragmentation in the digital era. In this resonance space of collective sense-making, we actively shape a human future in the AI age.
              </p>
            </section>

            {/* Purpose and Approach */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Purpose and Approach</h2>
              <p>
                The purpose of coherosphere is to build, in the face of the AI revolution, a new infrastructure of human cohesion and meaning – a resonance space that enables people to preserve connectedness, meaning, and autonomy despite rapid technological change. As a Decentralized Autonomous Organization (DAO), we act collectively and transparently to fulfill this purpose. Our goal is to lay a resilient social foundation for the post-industrial era – with a core of hard assets, committed communities, lived self-responsibility, and holistic health as a durable framework. To this end, coherosphere combines state-of-the-art decentralized technology with collective intelligence and progressive ethics. We use blockchain and AI as tools that serve humanity – not the other way around. Bitcoin serves as our solid financial foundation – a hard, tamper-proof asset beyond the reach of any central authority. This form of sound money provides a stable bedrock for resilience and freedom. At the same time, we rely on local resilience strategies: coherosphere supports community projects on the ground – from cooperative farming to education and healthcare – to strengthen real security and solidarity in our neighborhoods. Thus, global digital innovation merges with local empowerment. In this way, we create the conditions for meaning beyond work and resilience with purpose – meaning beyond traditional wage labor, and resilience rooted in a higher purpose. In short, coherosphere seeks to empower people to discover new meaning in a world shaped by AI and to move into the future resilient together.
              </p>
            </section>

            {/* Vision */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Vision</h2>
              <div className="space-y-4">
                <p>
                  We envision a society in which humanity, AI, and the planet coexist in harmony and strengthen one another. We strive for a new social contract for the 21st century, in which technological progress, human well-being, and the preservation of our environment go hand in hand. In this future, AI and humans complement each other instead of competing; prosperity and purpose are possible for all, and we preserve and deepen our humanity – our creativity, compassion, and love of freedom. Technology is democratically controlled and serves the common good, while natural resources and ecosystems are valued above short-term profits. Knowledge and progress are openly shared, not hoarded as instruments of power. Data and AI models are treated as common goods, not as the private property of a few corporations. Collective ownership structures – from data cooperatives to public knowledge platforms and global alliances – ensure that technological power contributes not to oppression but to the empowerment of all. Our vision is a diverse, participatory technological ecosystem committed to the well-being of everyone.
                </p>
                <p>
                  Equally important is the social and personal vision that coherosphere pursues. We imagine a culture in which community, creativity, and connection with nature play central roles. People no longer define themselves primarily by their job titles, but by their humanity: friendships, family, volunteer work, artistic creation, and lifelong learning. Technological progress gives us time instead of alienation – time to live in harmony with nature, to nurture artistic or manual talents, and to support one another. Routine work, once filling daily life, is taken over by automation, freeing people to pursue activities that create meaning and connection. True happiness lies in cultivating human relationships and a deeper purpose. AI can liberate us from dull routine, but the meaning of life we must actively create ourselves – through community, creativity, encounters with nature, and personal growth. Ultimately, we envision a world in which technological and social evolution allow every person to realize their full human potential, and in which progress is not perceived as a threat but as an opportunity for greater humanity.
                </p>
              </div>
            </section>

            {/* Principles */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Principles</h2>
              <p className="mb-6">To realize this vision, coherosphere is guided by a set of fundamental principles that serve as a compass for our actions:</p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Humanity and Meaning</h3>
                  <p>
                    We put people—and the question of meaning—at the center. Technology, especially AI, must serve life and enrich it, not dominate it. coherosphere prioritizes human well-being and meaning over mere efficiency or profit; every initiative should enhance quality of life, purpose, and human flourishing. We hold each person's lifetime as sacred and reject any system that seeks to extract wealth from it—whether through exploitative labor or through the control of our data, AI, and platforms.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Decentralized Community</h3>
                  <p>
                    We believe in the power of decentralized communities. coherosphere organizes itself without a central hierarchy – decisions are made collectively and transparently. We distribute knowledge, technology, and responsibility across many shoulders to counteract concentration of power. We do not wait for professional politicians or the state to provide solutions; instead, we trust in our collective wisdom and initiative. Our community is open to all who share our values—regardless of origin, gender, or status.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Self-Responsibility and Growth</h3>
                  <p>
                    Every member of coherosphere takes responsibility for their actions, learning, and well-being. We cultivate self-discipline, focus, mindfulness, and empathy – essential skills in the age of digital distraction. Each member is encouraged to grow, think critically, and take initiative. We remain masters of our tools, not their servants – using AI consciously and critically rather than being steered by algorithms. Mistakes are seen as opportunities to learn; accountability and openness to critique shape our culture.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Resilience and Health</h3>
                  <p>
                    Resilience – the ability to withstand crises and grow from them – is central to us. coherosphere builds long-term resilience across all dimensions: economic, social, mental, and ecological. We strengthen mental health through mindfulness and community spirit, and support physical health through sustainable ways of living. Our infrastructure is antifragile: hard assets and valuable reserves (e.g. Bitcoin as digital gold) provide financial stability and independence from centralized systems. Local food production, renewable energy, and community-based care make us less vulnerable to external shocks. Resilience also means acting with foresight – addressing problems openly and finding solutions before they escalate. Thus arises a foundation of health and self-sufficiency that endures even in turbulent times.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Transparency and Trust</h3>
                  <p>
                    We create trust through transparency. All essential processes—from decisions to financial transactions—are recorded on-chain and can be verified by all members. Our rules are codified in smart contracts and enforced automatically, preventing arbitrariness. A tamper-proof ledger documents all interactions, ensuring that no one needs to rely blindly on individuals. Every decision is auditable. At the same time, personal data remains protected: each individual retains control over their privacy.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Diversity and Participation</h3>
                  <p>
                    Diversity is our strength. We foster an open, inclusive culture committed to the common good. People from different backgrounds work together synergistically, learning from one another; collective intelligence emerges through the resonance of many perspectives. New members are welcomed with open arms and encouraged to contribute their talents. We share knowledge and resources generously, enabling everyone to grow. The fruits of our community—whether shared successes, learning experiences, or fair value creation—benefit all. In short, coherosphere is inclusive and democratic – every voice counts, and every idea can make a difference.
                  </p>
                </div>
              </div>
            </section>

            {/* Organization */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Organization</h2>
              <p>
                coherosphere is organized as a community-driven organization without central leadership. Rules and processes are embedded in smart contracts on a public blockchain. Decisions and transactions are automated and tamper-proof, beyond the control of any single authority. Neither corporations nor governments can take over coherosphere – governance lies trustlessly and transparently with the community and the code itself. Every member can propose initiatives—whether projects, rule changes, or allocation of resources. These proposals are openly discussed and then decided through blockchain-based voting. If the community approves, the corresponding smart contract comes into effect and implements the decision automatically. All votes and transfers are publicly visible, ensuring maximum transparency and accountability. Corruption or backroom deals find no fertile ground in this system.
              </p>
            </section>

            {/* Globally Connected, Locally Rooted */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Globally Connected, Locally Rooted</h2>
              <p>
                coherosphere is a global network with local cells. Our platform connects members worldwide; knowledge, data, and decisions are shared in real time across the globe. At the same time, we encourage the creation of local collectives (hubs) that implement projects aligned with our vision. These local groups—whether neighborhood cooperatives, learning circles, or resilient communities—act independently and adapt our principles to local realities. coherosphere supports them with resources such as funding, technology, and expertise, and connects them with each other. Thus a living network emerges, where successes and lessons spread rapidly across communities. It is a decentralized structure without top-down commands, where bottom-up initiatives thrive. Global cooperation and local self-determination reinforce one another.
              </p>
            </section>

            {/* Resources and Assets */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Resources and Assets</h2>
              <p>
                Our financial infrastructure rests on solid, decentralized foundations. The community treasury is held in value-stable assets – foremost among them Bitcoin, functioning as digital hard money immune to inflation and political interference. In addition, coherosphere invests in real-world projects that generate communal value, such as shared land, regenerative farms, or educational centers. These hard assets form a stable core that allows long-term planning and resilience even through economic storms. Through on-chain governance, the community jointly decides and controls the use of these resources. Agreements with external partners are, where possible, made on-chain or through innovative decentralized frameworks, ensuring that transparency and decentralization remain intact. Equally important, we ensure that any funding or support aligns with our shared purpose – we do not accept contributions that come with hidden agendas or strings attached. As a new type of organization, coherosphere combines the advantages of modern technology with the proven principles of cooperative communities, pioneering a collaborative structure in place of the old top-down, profit-driven models. We are at once a digital commons and a social network, both a global platform and a local fabric of solidarity. We believe this is more than an experiment – it is a model for the future of governance, collaboration, and social cohesion in the AI age.
              </p>
            </section>

            {/* 2035: A Possible Future */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">2035: A Possible Future</h2>
              <div className="space-y-4">
                <p>
                  What could a world look like in which the vision of coherosphere has become reality? Imagine the year 2035: in cities and villages around the globe, there are coherosphere community centers—physical or virtual places where people gather to learn, work, and celebrate together. Traditional full-time employment has disappeared for many, yet no one is condemned to idleness – on the contrary. Routine tasks are handled by AI systems, but instead of mass unemployment and loss of purpose, we witness a renaissance of human creativity and solidarity. What was once defined as a "job" has been replaced by a multitude of meaningful roles. People mentor one another, create artistic projects, cultivate community gardens, start local enterprises, conduct research, or care for the sick and elderly – activities that are socially valued and supported by coherosphere. Everyone contributes according to their talents and interests and finds recognition in the community. In place of traditional wage labor, a network of community tasks, learning journeys, and creative projects provides meaning and structure. No one measures their worth by job title or income anymore – they measure it by their contribution to the common good and their growth as a person.
                </p>
                <p>
                  The social impact is transformative: mental health and well-being have greatly improved, as stress from existential fears and alienating work has diminished. People spend more time in genuine relationships, in nature, and in cultural or physical activities—supported by the community. Loneliness and isolation have been replaced by vibrant neighborhoods and diverse spaces for encounter. AI assistants hum quietly in the background to ease our daily lives, yet we remain in charge: technology serves us and gives us time, rather than consuming us. Mindfulness is cultivated everywhere—through meditation circles, sports, or simply the slower rhythms of life. The younger generation grows up in an environment where education does not mean rote learning for tests, but the development of creativity, critical thinking, and character. Schools and learning centers—often initiated or supported by coherosphere—teach skills that machines do not possess: empathy, teamwork, problem-solving, ethical judgment. Lifelong learning has become the norm and is pursued voluntarily and joyfully because it is driven by meaning.
                </p>
                <p>
                  Even in the political and economic landscape, positive change is visible. Transparent, participatory decision-making processes have restored trust in public institutions. Many cities and municipalities have adopted elements of coherosphere's participatory model to strengthen citizen participation and direct democracy. Large companies orient themselves toward coherosphere's successful examples of shared ownership and co-determination. The old profit-only corporate mindset is fading, and new cooperatives and collectives are flourishing. Local resilience has reduced dependence on fragile global supply chains: nearly every community produces its own energy and food in sustainable cycles. When crises occur—whether climate-related or technological—a dense web of solidarity and reserves cushions the shocks. People know they can rely on their local collective and the global coherosphere network for support.
                </p>
                <p>
                  In this future, the once grim predictions have been overcome. Traditional unemployment has lost its terror, because "work" has been redefined – there is always something meaningful to do beyond monotonous wage labor. The feared crisis of meaning never came; instead, we experienced a cultural shift toward meaning beyond work. People find fulfillment in community, creativity, and personal growth – just as we dreamed. The anticipated mental decline from AI dependency has given way to resilient mindsets: coherosphere has enabled people to preserve their autonomy and grow actively, meeting AI with confidence and discernment. Surveillance and concentration of power have been curbed, as many services and infrastructures are in the hands of user communities. Trustworthy technology, instead of omniscient overseers, has become the standard. Social disorientation has been replaced by a renewal of shared values: transparency, participation, sustainability, and humanity are the guiding stars of a new era. The great challenges of our time—from climate change to global justice—are tackled cooperatively, with the help of collective intelligence and the awareness that we are all in the same boat. In short, we have created a future where meaning, resilience, and community form the foundation on which technological progress rests.
                </p>
              </div>
            </section>

            {/* Invitation */}
            <section className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-8 border border-orange-500/30">
              <h2 className="text-2xl font-bold text-white mb-6">Invitation</h2>
              <div className="space-y-4">
                <p>
                  This manifesto is a call to action. The problems described are real—but just as real is our ability to change course. If we allow fear or convenience to paralyze us, we may find ourselves asking in ten years: "How did we get here?" But if we choose courage, solidarity, and foresight today, we can embark on a new path—toward a future where technology and humanity complement rather than oppose each other, where prosperity and meaning are possible for all, and where we preserve and deepen our humanity.
                </p>
                <p>
                  coherosphere invites you to become part of this movement. This manifesto is more than a text – it is a living promise that we will fulfill together. If this vision of a human future in the age of AI inspires you—if you feel there must be more than the old "business as usual"—then do not hesitate: become a co-founder of the coherosphere. Help us build this coherosphere – our new sphere of cohesion and meaning. There is space here for your ideas, your talents, and your passion. Whether as a developer, artist, gardener, philosopher, or simply as a thoughtful human being – everyone finds a place and a role in our orange collective. The challenges are great, but our collective strength is greater. The time to act is now.
                </p>
                <p className="text-lg font-semibold text-orange-400">
                  Welcome to coherosphere – for a future that belongs to all of us.
                </p>
              </div>
            </section>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-16 text-center text-slate-500 border-t border-slate-700 pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>Version 1.0 · Inscribed on Bitcoin Block 914508</p>
          <p className="text-sm mt-2">coherosphere collective · 2025</p>
        </motion.div>
      </div>
    </div>
  );
}